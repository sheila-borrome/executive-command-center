import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface SearchBarProps {
  onSearch?: (q: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ onSearch, placeholder = "Search tasks, projects, meetings…", className = "" }: SearchBarProps) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = q.trim();
      if (trimmed) {
        onSearch?.(trimmed);
        navigate("/search", { state: { q: trimmed } });
      }
    },
    [q, onSearch, navigate]
  );

  return (
    <form onSubmit={handleSubmit} className={`flex flex-1 max-w-md ${className}`}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-l-lg border border-gray-600 bg-surface-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="rounded-r-lg border border-l-0 border-gray-600 bg-surface-700 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-surface-600"
      >
        Search
      </button>
    </form>
  );
}
