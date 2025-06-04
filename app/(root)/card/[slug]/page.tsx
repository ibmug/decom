
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductPrice from "@/components/shared/product/productPrice";    // if you want price styling
//import AddToCart from "@/components/shared/product/add-to-cart";       // if cards are purchasable
import ManaCost from "@/components/shared/manacost";
import Image from "next/image";
import OracleText from "@/components/shared/oracletext";
import { getSingleCardBySlug} from "@/lib/actions/card.actions";


export const dynamic = "force-dynamic";




export default async function CardDetailsPage(props: {params: Promise<{slug: string}>}) {
  const { slug } = await props.params;
  const card = await getSingleCardBySlug(slug);
  if (!card) notFound();

  const imageUrl = card.imageUrl ?? "/images/cardPlaceholder.png";
  

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Images */}
        <div className="col-span-2">
          <Link href={`/card/${slug}`}>
          
              <Image src={imageUrl}  alt='product image' width={1000} height={1000} className='min-h-[300px] object-cover object-center'/>
          </Link>
        </div>

        {/* Card details */}
        <div className="col-span-2">
          <h1 className="text-3xl font-bold">{card.name}</h1>
          <p className="text-sm text-gray-600">{card.setName}</p>

          {/* Show any metadata fields you’ve got */}
          <ul className="space-y-2">
            <li><strong>Type:</strong> {card.type}</li>
            <li><strong>Rarity:</strong> {card.rarity}</li>
            <li><strong>Mana Cost:</strong> {<ManaCost cost={card.manaCost ?? "No Mana Cost"} size={18}/>}</li>
            <li><strong>Text:</strong> {<OracleText text={card.oracleText ?? "No Oracle Text."} iconSize={14}/>}</li>
            {/* …and so on */}
          </ul>
        </div>

        {/* Action / Purchase */}
        <div className="col-span-1">
          <Card>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Price</span>
                <ProductPrice value={Number(card.usdPrice)} />
              </div>
              <div className="flex justify-between items-center">
                <span>Status</span>
                {card.stock > 0
                  ? <Badge variant="outline">In Stock</Badge>
                  : <Badge variant="destructive">Sold Out</Badge>}
              </div>

              {card.stock > 0 && (
                <div className="text-center">
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
