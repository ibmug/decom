export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getSingleCardBySlug } from "@/lib/actions/card.actions";
import { getServerSession } from "next-auth/next";
import CardDetailsDisplay from "@/components/shared/CardDisplay/CardDetailsDisplay";
import { authOptions } from "@/lib/authOptions";

export default async function CardDetailsPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const card = await getSingleCardBySlug(slug);
  if (!card) notFound();
  //console.log(card)

  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role ?? "USER";
  const isAdminOrManager = userRole === "admin" || userRole === "manager";
  console.log(userRole)

  if (!card || card.type !== "CARD") notFound();

return <CardDetailsDisplay product={card} isAdminOrManager={isAdminOrManager} />;

}
