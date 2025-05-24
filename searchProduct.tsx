import { GetServerSideProps } from "next";
import ProductCard from "@/components/shared/product/productCard";
import Pagination  from "@/components/shared/pagination";
import { getAllProducts, UIProduct } from "@/lib/actions/product.actions";

interface SearchProps {
  products:     UIProduct[];
  totalPages:   number;
  currentPage:  number;
  filters: {
    q:        string;
    category: string;
    price:    string;
    rating:   string;
    sort:     string;
    page:     number;
  };
}

export const getServerSideProps: GetServerSideProps<SearchProps> = async (ctx) => {
  // 1) Pull query-params out of ctx.query (all are strings or arrays)
  const {
    q = "",
    category = "all",
    price = "all",
    rating = "all",
    sort = "newest",
    page = "1",
  } = ctx.query;

  // 2) Fetch once on the server
  const {
    data: products,
    totalPages,
    currentPage,
  } = await getAllProducts({
    query:    String(q),
    category: String(category),
    price:    String(price),
    rating:   String(rating),
    sort:     String(sort),
    page:     Number(page),
  });

  // 3) Return props
  return {
    props: {
      products,
      totalPages,
      currentPage,
      filters: {
        q:        String(q),
        category: String(category),
        price:    String(price),
        rating:   String(rating),
        sort:     String(sort),
        page:     Number(page),
      },
    },
  };
};

export default function SearchPage({
  products,
  totalPages,
  currentPage,
  filters: { q, category, price, rating, sort, page },
}: SearchProps) {
  return (
    <div className="space-y-6">
      {/* --- Products Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.length === 0 ? (
          <p>No products found for “{q}”.</p>
        ) : (
          products.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>

      {/* --- Pagination Controls --- */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        getPageLink={(pg) =>
          `/search?${new URLSearchParams({
            q,
            category,
            price,
            rating,
            sort,
            page: String(pg),
          }).toString()}`
        }
      />
    </div>
  );
}
