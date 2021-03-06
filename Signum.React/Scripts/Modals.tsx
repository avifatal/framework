import * as Navigator from './Navigator';
import * as History from 'history'
import * as React from 'react'
import { FunctionalAdapter } from './Frames/FrameModal';
import { useStateWithPromise, useHistoryListen } from './Hooks';

declare global {
  interface KeyboardEvent {
    openedModals?: boolean;
  }
}

export interface IModalProps<T> {
  onExited?: (val: T) => void;
}

export interface IHandleKeyboard {
  handleKeyDown?: (e: KeyboardEvent) => void;
}

export interface GlobalModalContainerState {
  modals: React.ReactElement<IModalProps<any>>[];
  currentUrl: string;
}
let current: GlobalModalContainerHandles;
  
const modalInstances: (React.Component & IHandleKeyboard)[] = [];

interface GlobalModalContainerHandles {
  pushModal(element: React.ReactElement<any>) : Promise<any>;
  popModal(element: React.ReactElement<any>): Promise<any>;
  getCount(): number;
}

export function GlobalModalContainer() {
  React.useEffect(() => {
    window.addEventListener("keydown", hanldleKeyDown);
    return () => window.removeEventListener("keydown", hanldleKeyDown);
  }, []);

  var [modals, setModals] = useStateWithPromise<React.ReactElement<IModalProps<any>>[]>([]);

  useHistoryListen(() => setModals([]), true);

  React.useEffect(() => {
    current = {
      pushModal: e => setModals([...modals, e]),
      popModal: e => setModals(modals.filter(a=>a != e)),
      getCount: () => modals.length
    };
    return () => { current = null!; };
  }, [modals.length]);

  function hanldleKeyDown(e: KeyboardEvent){
    if (modalInstances.length) {
      e.openedModals = true;
      var topMost = modalInstances[modalInstances.length - 1];
      topMost = FunctionalAdapter.innerRef(topMost);
      if (topMost && topMost.handleKeyDown) {
        topMost.handleKeyDown(e);
      }
    }
  }


  React.useEffect(() => {
    setModals([]);
  }, [Navigator.history.location.pathname])


  return React.createElement("div", { className: "sf-modal-container" }, ...modals);
}

export function openModal<T>(modal: React.ReactElement<IModalProps<T>>): Promise<T> {

  return new Promise<T>((resolve) => {
    let cloned: React.ReactElement<IModalProps<T>>;
    const onExited = (val: T) => {
      current.popModal(cloned)
        .then(() => resolve(val))
        .done();
    }

    cloned = FunctionalAdapter.withRef(React.cloneElement(modal, { onExited: onExited, key: current.getCount() } as any),
      c => {
        c ? modalInstances.push(c) : modalInstances.pop();
      });

    return current.pushModal(cloned);
  });
}

