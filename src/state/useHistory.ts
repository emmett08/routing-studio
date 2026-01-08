import { useMemo, useReducer } from "react";

type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
};

type Action<T> =
  | { type: "SET"; next: T }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; next: T };

function reducer<T>(state: HistoryState<T>, action: Action<T>): HistoryState<T> {
  switch (action.type) {
    case "SET": {
      if (Object.is(action.next, state.present)) return state;
      return {
        past: [...state.past, state.present],
        present: action.next,
        future: [],
      };
    }
    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1]!;
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0]!;
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }
    case "RESET": {
      return { past: [], present: action.next, future: [] };
    }
    default:
      return state;
  }
}

/** Undo/redo with value semantics. Prefer passing an already-cloned next value. */
export function useHistory<T>(initial: T) {
  const [state, dispatch] = useReducer(reducer<T>, {
    past: [],
    present: initial,
    future: [],
  });

  const api = useMemo(
    () => ({
      value: state.present,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      set(next: T) {
        dispatch({ type: "SET", next });
      },
      undo() {
        dispatch({ type: "UNDO" });
      },
      redo() {
        dispatch({ type: "REDO" });
      },
      reset(next: T) {
        dispatch({ type: "RESET", next });
      },
    }),
    [state.future.length, state.past.length, state.present],
  );

  return api;
}
