import { useEffect, useRef, useState } from "react";
import { Api } from "./lessonsApi";

const TERMINAL = new Set(["ready", "error"]);

// Lists YouTube lessons and keeps them live via WebSocket while any are
// still processing. Shared by the Home page (add form + library preview)
// and the Luyện nghe YouTube practice mode.
export function useLessons() {
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState(null);
  const socketsRef = useRef(new Map());

  const refresh = () => {
    Api.listLessons()
      .then((rows) => {
        setLessons(rows);
        setError(null);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    refresh();
    const sockets = socketsRef.current;
    return () => {
      sockets.forEach((ws) => ws.close());
      sockets.clear();
    };
  }, []);

  useEffect(() => {
    lessons.forEach((lesson) => {
      if (TERMINAL.has(lesson.status) || socketsRef.current.has(lesson.id)) return;
      Api.jobSocket(lesson.id, (evt) => {
        refresh();
        if (TERMINAL.has(evt.status)) {
          socketsRef.current.get(lesson.id)?.close();
          socketsRef.current.delete(lesson.id);
        }
      }).then((ws) => socketsRef.current.set(lesson.id, ws));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons]);

  const addLesson = (url) =>
    Api.addLesson(url)
      .then(() => refresh())
      .catch((err) => {
        setError(err.message);
        throw err;
      });

  const deleteLesson = (id) =>
    Api.deleteLesson(id)
      .then(() => refresh())
      .catch((err) => {
        setError(err.message);
        throw err;
      });

  return { lessons, error, refresh, addLesson, deleteLesson };
}
