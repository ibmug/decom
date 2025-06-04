import CardDisplay from "../CardDisplay/card-display";
import AccessoryDisplay from "../AccessoryDisplay/accessory-display";
import { UIStoreProduct } from "@/types";
import { toCardItem } from "@/lib/utils/transformers";

const ProductList = ({
  data,
  title,
  limit,
}: {
  data: UIStoreProduct[];
  title?: string;
  limit?: number;
}) => {
  const limitedData = limit ? data.slice(0, limit) : data;

  return (
    <div className="my-10">
      <h2 className="h2-bold mb-4">{title}</h2>

      {data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {limitedData.map((product) => {
            if (product.type === "CARD" && product.cardMetadata) {
              return (
                <CardDisplay
                  key={product.id}
                  product={toCardItem(product)}
                  session={null} // or pass session if needed
                />
              );
            }

            if (product.type === "ACCESSORY" && product.accessory) {
              return (
                <AccessoryDisplay
                  key={product.id}
                  product={product}
                  session={null} // or pass session if needed
                />
              );
            }

            return null;
          })}
        </div>
      ) : (
        <div>
          <p> WE ARE OUT OF STOCK</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;
