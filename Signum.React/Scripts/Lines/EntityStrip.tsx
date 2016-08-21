﻿import * as React from 'react'
import { Link } from 'react-router'
import { classes, Dic } from '../Globals'
import * as Navigator from '../Navigator'
import * as Constructor from '../Constructor'
import * as Finder from '../Finder'
import { FindOptions } from '../FindOptions'
import { TypeContext, StyleContext, StyleOptions, FormGroupStyle, mlistItemContext, EntityFrame } from '../TypeContext'
import { PropertyRoute, PropertyRouteType, MemberInfo, getTypeInfo, getTypeInfos, TypeInfo, IsByAll, ReadonlyBinding, LambdaMemberType } from '../Reflection'
import { LineBase, LineBaseProps, FormGroup, FormControlStatic, runTasks, } from '../Lines/LineBase'
import { ModifiableEntity, Lite, Entity, MList, MListElement, EntityControlMessage, JavascriptMessage, toLite, is, liteKey, getToString, newMListElement } from '../Signum.Entities'
import Typeahead from '../Lines/Typeahead'
import { EntityListBase, EntityListBaseProps } from './EntityListBase'

export interface EntityStripProps extends EntityListBaseProps {
    vertical?: boolean;
    autoComplete?: boolean;

    autoCompleteGetItems?: (query: string) => Promise<Lite<Entity>[]>;
    autoCompleteRenderItem?: (lite: Lite<Entity>, query: string) => React.ReactNode;
}

export class EntityStrip extends EntityListBase<EntityStripProps, EntityStripProps> {

    calculateDefaultState(state: EntityStripProps) {
        super.calculateDefaultState(state);
        state.autoComplete = !state.type!.isEmbedded && state.type!.name != IsByAll;
        state.create = false;
        state.find = false;
    }

    defaultAutoCompleteGetItems = (query: string) => Finder.API.findLiteLike({
        types: this.state.type!.name,
        subString: query,
        count: 5
    });

    defaultAutCompleteRenderItem = (lite: Lite<Entity>, query: string) => Typeahead.highlightedText(lite.toStr || "", query);


    renderInternal() {

        const s = this.state;

        return (
            <FormGroup ctx={s.ctx!} labelText={s.labelText} labelProps={s.labelHtmlProps} {...Dic.extend(this.baseHtmlProps(), this.state.formGroupHtmlProps) }>
                <div className="SF-entity-strip SF-control-container">
                    <ul className={classes("sf-strip", this.props.vertical ? "sf-strip-vertical" : "sf-strip-horizontal") }>
                        {
                            mlistItemContext(s.ctx).map((mlec, i) =>
                                (<EntityStripElement key={i}
                                    ctx={mlec}
                                    onRemove={this.state.remove ? e => this.handleRemoveElementClick(e, i) : undefined}
                                    onView={this.state.view ? e => this.handleViewElement(e, i) : undefined}
                                    />))
                        }
                        <li className="sf-strip-input input-group">
                            {this.renderAutoComplete() }
                            <span>
                                { this.renderCreateButton(false) }
                                { this.renderFindButton(false) }
                            </span>
                        </li> 
                    </ul>
                </div>
            </FormGroup>
        );

    }
    
    handleOnSelect = (lite: Lite<Entity>, event: React.SyntheticEvent) => {
        this.convert(lite)
            .then(e => {
                const list = this.props.ctx.value!;
                list.push(newMListElement(e));
                this.setValue(list);
            }).done();
        return "";

    }

    handleViewElement = (event: React.MouseEvent, index: number) => {

        event.preventDefault();

        const ctx = this.state.ctx;
        const list = ctx.value!;
        const mle = list[index];
        const entity = mle.element;

        const openWindow = (event.button == 2 || event.ctrlKey) && !this.state.type!.isEmbedded;
        if (openWindow) {
            event.preventDefault();
            const route = Navigator.navigateRoute(entity as Lite<Entity> /*or Entity*/);
            window.open(route);
        }
        else {
            const promise = this.props.onView ?
                this.props.onView(entity, ctx.propertyRoute) :
                this.defaultView(entity, ctx.propertyRoute);

            if (promise == null)
                return;

            promise.then(e => {
                if (e == undefined)
                    return;

                this.convert(e).then(m => {
                    if (is(list[index].element as Entity, e as Entity))
                        list[index].element = m;
                    else
                        list[index] = { rowId: null, element: m };

                    this.setValue(list);
                }).done();
            }).done();
        }
    }


    renderAutoComplete() {

        if (!this.state.autoComplete || this.state.ctx!.readOnly)
            return undefined;

        return (
            <Typeahead
                inputAttrs={{ className: "sf-entity-autocomplete" }}
                getItems={this.props.autoCompleteGetItems || this.defaultAutoCompleteGetItems}
                renderItem={this.props.autoCompleteRenderItem || this.defaultAutCompleteRenderItem}
                liAttrs={lite => ({ 'data-entity-key': liteKey(lite) }) }
                onSelect={this.handleOnSelect}/>
        );
    }
}


export interface EntityStripElementProps {
    onRemove?: (event: React.MouseEvent) => void;
    onView?: (event: React.MouseEvent) => void;
    ctx: TypeContext<Lite<Entity> | ModifiableEntity>;
}

export class EntityStripElement extends React.Component<EntityStripElementProps, void>
{
    render() {

        return (
            <li className="sf-strip-element input-group" {...EntityListBase.entityHtmlProps(this.props.ctx.value) }>
                {
                    this.props.onView ?
                        <a className="sf-entitStrip-link" href="#" onClick={this.props.onView}>
                            {this.props.ctx.value.toStr}
                        </a>
                        :
                        <span className="sf-entitStrip-link">
                            {this.props.ctx.value.toStr}
                        </span>
                }
               
                {this.props.onRemove &&
                    <span>
                        <a className="sf-line-button sf-remove" 
                            onClick={this.props.onRemove}
                            title={EntityControlMessage.Remove.niceToString() }>
                            <span className="glyphicon glyphicon-remove"></span></a>
                    </span>
                }
            </li>
        );
    }
}

