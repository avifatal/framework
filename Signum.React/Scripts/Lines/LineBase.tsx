﻿
import * as React from 'react'
import * as moment from 'moment'
import { classes, Dic, addClass } from '../Globals'
import { Tab } from 'react-bootstrap'
import { TypeContext, StyleContext, StyleOptions, FormGroupStyle } from '../TypeContext'
import { PropertyRouteType, MemberInfo, getTypeInfo, TypeInfo, TypeReference} from '../Reflection'

require("!style!css!./Lines.css");

export interface FormGroupProps extends React.Props<FormGroup> {
    labelText?: React.ReactChild;
    controlId?: string;
    ctx: StyleContext;
    labelProps?: React.HTMLAttributes;
    htmlProps?: React.HTMLAttributes;
}

export class FormGroup extends React.Component<FormGroupProps, {}> {

    render() {

        const ctx = this.props.ctx;

        const tCtx = ctx as TypeContext<any>;

        var errorClass = tCtx.errorClass;

        if (ctx.formGroupStyle == "None") {

            var c = this.props.children as React.ReactElement<any>;
         
            return (
                <div {...this.props.htmlProps} className={ errorClass }>
                    {c}
                </div>
            );
        }

        const labelClasses = classes(ctx.formGroupStyle == "SrOnly" && "sr-only",
            ctx.formGroupStyle == "LabelColumns" && ("control-label " + ctx.labelColumnsCss));


        const label = (
            <label htmlFor={this.props.controlId} {...this.props.labelProps } className= { addClass(this.props.labelProps, labelClasses) } >
                { this.props.labelText || tCtx.propertyRoute && tCtx.propertyRoute.member.niceName }
            </label>
        );

        return <div {...this.props.htmlProps} className={ classes("form-group", this.props.ctx.formGroupSizeCss, errorClass) }>
            { ctx.formGroupStyle != "BasicDown" && label }
            {
                ctx.formGroupStyle == "LabelColumns" ? (<div className={ this.props.ctx.valueColumnsCss } > { this.props.children } </div>) : this.props.children}
            {ctx.formGroupStyle == "BasicDown" && label
            }
        </div>;
    }
}


export interface FormControlStaticProps extends React.Props<FormControlStatic> {
    controlId?: string;
    ctx: StyleContext;
    className?: string
}

export class FormControlStatic extends React.Component<FormControlStaticProps, {}>
{
    render() {
        const ctx = this.props.ctx;

        return (
            <p id={ this.props.controlId }
                className ={classes(ctx.formControlStaticAsFormControlReadonly ? "form-control readonly" : "form-control-static", this.props.className) }>
                { this.props.children }
            </p>
        );
    }
}

export interface LineBaseProps extends StyleOptions {
    ctx?: TypeContext<any>;
    type?: TypeReference;
    labelText?: React.ReactChild;
    visible?: boolean;
    hideIfNull?: boolean;
    onChange?: (val: any) => void;
    labelHtmlProps?: React.HTMLAttributes;
    formGroupHtmlProps?: React.HTMLAttributes;
}

export abstract class LineBase<P extends LineBaseProps, S extends LineBaseProps> extends React.Component<P, S> {

    constructor(props: P) {
        super(props);

        this.state = this.calculateState(props);
    }

    componentWillReceiveProps(nextProps: P, nextContext: any) {
        this.setState(this.calculateState(nextProps));
    }

    changes = 0;
    setValue(val: any) {
        this.state.ctx.value = val;
        this.changes++;
        this.forceUpdate();
        if (this.state.onChange)
            this.state.onChange(val);
    }

    render() {

        if (this.state.visible == false || this.state.hideIfNull && this.state.ctx.value == null)
            return null;

        return this.renderInternal();
    }

    calculateState(props: P): S {

        var so = {
            formControlStaticAsFormControlReadonly: null,
            formGroupSize: null,
            formGroupStyle: null,
            labelColumns: null,
            placeholderLabels: null,
            readOnly: null,
            valueColumns: null,
        } as StyleOptions;

        var cleanProps = Dic.without(props, so);

        const state = { ctx: cleanProps.ctx.subCtx(so), type: (cleanProps.type || cleanProps.ctx.propertyRoute.member.type) } as LineBaseProps as S;
        this.calculateDefaultState(state);
        runTasks(this, state);
        var overridenProps = Dic.without(cleanProps, { ctx: null, type: null }) as LineBaseProps as S;
        this.overrideProps(state, overridenProps);
        return state;
    }
    
    overrideProps(state: S, overridenProps: S) {
        var labelHtmlProps = Dic.extend(state.labelHtmlProps, overridenProps.labelHtmlProps);
        Dic.extend(state, overridenProps);
        state.labelHtmlProps = labelHtmlProps;
    }

    baseHtmlProps(): React.HTMLAttributes {
        return {
            'data-propertyPath': this.state.ctx.propertyPath,
            'data-changes': this.changes
        } as any;
    }

    calculateDefaultState(state: S) {
    }

    abstract renderInternal(): JSX.Element;
}


export const tasks: ((lineBase: LineBase<LineBaseProps, LineBaseProps>, state: LineBaseProps) => void)[] = [];

export function runTasks(lineBase: LineBase<LineBaseProps, LineBaseProps>, state: LineBaseProps) {
    tasks.forEach(t => t(lineBase, state));
}