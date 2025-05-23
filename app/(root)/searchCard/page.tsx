
import CardDisplay from "@/components/shared/CardDisplay/card-display";
import Pagination from "./pagination";
import { getAllCardProducts, getAllSets } from "@/lib/actions/card.actions";
import { PAGE_SIZE } from "@/lib/constants";

// interface SearchParams {
//   name?:     string;
//   color?:    string;
//   manaCost?: string;
//   price?:    string;
//   set?:      string;
//   rarity?:   string;
//   page?:     string;
// }

// Build the URL with only the active filters
const getFilterUrl = (params: Record<string, string | undefined>) => {
  const clean: Record<string, string> = {};
  for (const k in params) {
    const v = params[k];
    if (v && v !== "all") clean[k] = v;
  }
  if (params.page) clean.page = params.page;
  const qs = new URLSearchParams(clean).toString();
  return `/searchCard${qs ? `?${qs}` : ""}`;
};
console.log(getFilterUrl);





export default async function SearchPage({searchParams}) {
  // 1) Await searchParams so destructuring works without that Next.js error
  
  const sp = searchParams;

  // 2) Destructure with defaults
  const {
    name     = "all",
    color    = "all",
    manaCost = "all",
    price    = "all",
    set      = "all",
    rarity   = "all",
    page     = "1",
  } = sp;

  

    const { data, totalPages } = await getAllCardProducts(page, PAGE_SIZE);
    const allSets = await getAllSets();
  console.log(name,color,manaCost,price,set,rarity) 
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
      {/* Sidebar filters */}
      <aside className="md:col-span-1 p-4 space-y-4 border rounded">
        <h2 className="font-bold text-lg">Filters</h2>
         {allSets.map((prod) => (
              <div key={prod.setName}>{prod.setName}</div>
            ))}
        {/* TODO: replicate the same pattern for color, set, rarity, etc. */}
      </aside>

      {/* Results grid */}
      <main className="md:col-span-4">
        {data.length === 0 ? (
          <p>No cards found matching those filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((prod) => (
              <CardDisplay key={prod.id} product={prod} />
            ))}
          </div>
        )}

        {/* Pagination via Links */}
        <nav className="mt-6 flex justify-center space-x-2">
          <Pagination totalPages={totalPages}/>
        </nav>
      </main>
    </div>
  );
}
