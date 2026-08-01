"use server";


import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";


import { createClient as createAuthClient } from "@/lib/supabase/server";


const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;


const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;


if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "Missing server-side Supabase credentials."
  );
}


const supabaseAdmin = createAdminClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);


async function verifyAdmin() {
  const supabaseAuth =
    await createAuthClient();


  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser();


  if (error) {
    throw new Error(
      `Login could not be verified: ${error.message}`
    );
  }


  const signedInEmail =
    user?.email?.trim().toLowerCase();


  const adminEmail =
    process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();


  if (
    !signedInEmail ||
    !adminEmail ||
    signedInEmail !== adminEmail
  ) {
    redirect("/admin/login");
  }
}


export async function markOrderFulfilled(
  formData: FormData
) {
  await verifyAdmin();


  const rawOrderId =
    formData.get("orderId");


  const orderId = Number(rawOrderId);


  if (
    !Number.isInteger(orderId) ||
    orderId <= 0
  ) {
    throw new Error(
      `Invalid order ID: ${String(rawOrderId)}`
    );
  }


  const {
    data: updatedOrder,
    error,
  } = await supabaseAdmin
    .from("orders")
    .update({
      fulfillment_status: "fulfilled",
    })
    .eq("id", orderId)
    .select("id, fulfillment_status")
    .single();


  if (error) {
    console.error(
      "Fulfillment update failed:",
      error
    );


    throw new Error(
      `Order could not be updated: ${error.message}`
    );
  }


  if (
    !updatedOrder ||
    updatedOrder.fulfillment_status !==
      "fulfilled"
  ) {
    throw new Error(
      "The order was found, but its status did not update."
    );
  }


  revalidatePath(
    "/admin/orders",
    "page"
  );


  redirect("/admin/orders");
}
