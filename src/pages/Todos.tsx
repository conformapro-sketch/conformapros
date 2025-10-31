import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Todo = {
  id: string;
  title: string;
};

export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("id, title");

      if (error) {
        setError(error.message);
        return;
      }

      setTodos((data ?? []) as Todo[]);
    };

    void fetchTodos();
  }, []);

  if (error) {
    return <div role="alert">Erreur lors du chargement : {error}</div>;
  }

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
