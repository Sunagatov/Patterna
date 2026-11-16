import { useCallback, useEffect, useRef, useState } from "react";

const currentUrl = () => location.pathname + location.search + location.hash;

export function usePageRoute() {
  const [url, setUrl] = useState(currentUrl);
  const dirty = useRef(false);
  const position = useRef<number>(history.state?.patternaPosition ?? 0);
  const restoring = useRef(false);
  const previousUrl = useRef(url);

  useEffect(() => {
    history.replaceState(
      { ...history.state, patternaPosition: position.current },
      "",
    );
    function pop(event: PopStateEvent) {
      if (restoring.current) {
        restoring.current = false;
        return;
      }
      const nextPosition = event.state?.patternaPosition;
      if (
        dirty.current &&
        !window.confirm("Discard your unsaved solution changes?")
      ) {
        if (typeof nextPosition === "number") {
          restoring.current = true;
          history.go(position.current - nextPosition);
        } else {
          history.pushState(
            { patternaPosition: position.current },
            "",
            previousUrl.current,
          );
        }
        return;
      }
      position.current =
        typeof nextPosition === "number" ? nextPosition : position.current - 1;
      previousUrl.current = currentUrl();
      dirty.current = false;
      setUrl(currentUrl());
    }
    function leaving(event: BeforeUnloadEvent) {
      if (!dirty.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("popstate", pop);
    window.addEventListener("beforeunload", leaving);
    return () => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener("beforeunload", leaving);
    };
  }, []);

  function navigate(nextUrl: string) {
    if (nextUrl === currentUrl()) return;
    if (
      dirty.current &&
      !window.confirm("Discard your unsaved solution changes?")
    )
      return;
    dirty.current = false;
    position.current += 1;
    history.pushState({ patternaPosition: position.current }, "", nextUrl);
    previousUrl.current = currentUrl();
    setUrl(currentUrl());
    window.scrollTo(0, 0);
  }

  const setDirty = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);
  return { url, navigate, setDirty };
}
