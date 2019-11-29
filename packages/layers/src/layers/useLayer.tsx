import React, { useContext, useRef, useMemo } from "react";
import { LayerContext } from "./context";
import { useConnectorHooks, ConnectorElementWrapper } from "craftjs-utils";
import { EventContext } from "../events";
import { useLayerManager } from "../manager";
import { useManager } from "craftjs";
import { Layer } from "../interfaces";



type internalActions = LayerContext & {
  children: string[],
  connectDrag: ConnectorElementWrapper;
  connectLayer: ConnectorElementWrapper;
  connectLayerHeader: ConnectorElementWrapper;
  actions: {
    toggleLayer: () => void
  }
}

export type useLayer<S = null> = S extends null ? internalActions : S & internalActions;
export function useLayer(): useLayer
export function useLayer<S = null>(collect?: (node: Layer) => S): useLayer<S>
export function useLayer<S = null>(collect?: (layer: Layer) => S): useLayer <S> {
  
  const {id, depth } = useContext(LayerContext);
  const { actions: managerActions, ...collected } = collect ? useLayerManager((state) => {
    return id && state.layers[id] && collect(state.layers[id]) 
  }) : useLayerManager();

  const { children } = useManager((state, query) => ({
    children: state.nodes[id] && query.getDeepNodes(id, false)
  }));


  const handlers = useContext(EventContext);


  const connectors = useConnectorHooks({
    connectLayer: (node) => {
      handlers.onMouseDown(node, id)
      handlers.onMouseOver(node, id)
      handlers.onDragOver(node, id)
      handlers.onDragEnd(node, id)

      managerActions.setDOM(id, {
        dom: node,
      });
    }, 
    connectLayerHeader: (node) => {
      managerActions.setDOM(id, {
        headingDom: node,
      });
    },
    connectDrag: [
      (node) => {
        node.setAttribute("draggable", true);
        handlers.onDragStart(node, id);
      },
      (node) => node.removeAttribute("draggable")
    ]
  }) as any;

  const actions = useMemo(() => {
    return {
      toggleLayer: () => managerActions.toggleLayer(id)
    }
  }, []);

  return {
    id,
    depth,
    children,
    actions,
    ...connectors as any,
    ...collected as any
  }
}