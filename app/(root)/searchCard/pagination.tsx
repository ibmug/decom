"use client";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  totalPages: number;
}

export default function Pagination({ totalPages }: PaginationProps) {
  const router = useRouter();
  const params = useSearchParams();
  const currentPage = Number(params.get("page") ?? "1");

  function go(page: number) {
    const qp = new URLSearchParams(params.toString());
    qp.set("page", String(page));
    router.push(`?${qp.toString()}`);
  }

  return (
    <nav className="flex items-center space-x-2">
      {totalPages > 2 && currentPage > 1 && (
        <button
          onClick={() => go(1)}
          className="px-2 py-1 border rounded hover:bg-gray-100"
        >
          First
        </button>
      )}

      {currentPage > 1 && (
        <button
          onClick={() => go(currentPage - 1)}
          className="px-2 py-1 border rounded hover:bg-gray-100"
        >
          Prev
        </button>
      )}

      <span className="px-3 py-1 font-semibold">{currentPage}</span>

      {currentPage < totalPages && (
        <button
          onClick={() => go(currentPage + 1)}
          className="px-2 py-1 border rounded hover:bg-gray-100"
        >
          Next
        </button>
      )}

      {totalPages > 2 && currentPage < totalPages && (
        <button
          onClick={() => go(totalPages)}
          className="px-2 py-1 border rounded hover:bg-gray-100"
        >
          Last
        </button>
      )}
    </nav>
  );
}
