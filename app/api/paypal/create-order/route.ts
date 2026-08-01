import { createClient } from "@supabase/supabase-js";
import {
  NextRequest,
  NextResponse,
} from "next/server";


const paypalBase =
  process.env.PAYPAL_API_BASE ||
  "https://api-m.sandbox.paypal.com";


const clientId =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;


const clientSecret =
  process.env.PAYPAL_CLIENT_SECRET;


const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;


const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;


const SHIRT_PRICE_CENTS = 4999;
const SHIPPING_CENTS = 999;


type CartItem = {
  slug: string;
  size: string;
  quantity: number;
};


type InventoryRow = {
  quantity: number;
};


type PayPalCreateOrderResponse = {
  id?: string;
  message?: string;
  details?: unknown;
};


const productNames: Record<string, string> = {
  gray:
    "ASCEND Track Graphic Tee — Vintage Gray",
  black:
    "ASCEND Track Graphic Tee — Vintage Black",
  cream:
    "ASCEND Track Graphic Tee — Cream",
};


if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "Missing server-side Supabase credentials."
  );
}


const supabaseAdmin = createClient(
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


async function getAccessToken() {
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing PayPal credentials."
    );
  }


  const auth = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");


  const response = await fetch(
    `${paypalBase}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    }
  );


  const responseText =
    await response.text();


  if (!response.ok) {
    throw new Error(
      `PayPal token error: ${responseText}`
    );
  }


  const data = JSON.parse(responseText);


  return data.access_token as string;
}


export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();


    const cart = body.cart as
      | CartItem[]
      | undefined;


    if (
      !Array.isArray(cart) ||
      cart.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Your shopping bag is empty.",
        },
        { status: 400 }
      );
    }


    let totalQuantity = 0;


    const paypalItems: Array<{
      name: string;
      description: string;
      quantity: string;
      unit_amount: {
        currency_code: string;
        value: string;
      };
    }> = [];


    for (const item of cart) {
      const quantity = Number(
        item.quantity
      );


      if (
        !productNames[item.slug] ||
        !item.size ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid cart item.",
          },
          { status: 400 }
        );
      }


      const {
        data: inventoryRow,
        error: inventoryError,
      } = await supabaseAdmin
        .from("inventory")
        .select("quantity")
        .eq("product_slug", item.slug)
        .eq("size", item.size)
        .maybeSingle<InventoryRow>();


      if (
        inventoryError ||
        !inventoryRow
      ) {
        console.error(
          "Inventory verification error:",
          inventoryError
        );


        return NextResponse.json(
          {
            error:
              `${productNames[item.slug]} in ${item.size} could not be verified.`,
          },
          { status: 400 }
        );
      }


      if (
        quantity >
        inventoryRow.quantity
      ) {
        return NextResponse.json(
          {
            error:
              inventoryRow.quantity === 0
                ? `${productNames[item.slug]} in ${item.size} is sold out.`
                : `Only ${inventoryRow.quantity} ${item.size} shirt(s) remain.`,
          },
          { status: 409 }
        );
      }


      totalQuantity += quantity;


      paypalItems.push({
        name: productNames[item.slug],
        description: item.size,
        quantity: String(quantity),
        unit_amount: {
          currency_code: "USD",
          value: (
            SHIRT_PRICE_CENTS / 100
          ).toFixed(2),
        },
      });
    }


    const itemTotalCents =
      totalQuantity *
      SHIRT_PRICE_CENTS;


    const totalCents =
      itemTotalCents +
      SHIPPING_CENTS;


    const accessToken =
      await getAccessToken();


    const response = await fetch(
      `${paypalBase}/v2/checkout/orders`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
          Prefer:
            "return=representation",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: (
                  totalCents / 100
                ).toFixed(2),
                breakdown: {
                  item_total: {
                    currency_code:
                      "USD",
                    value: (
                      itemTotalCents /
                      100
                    ).toFixed(2),
                  },
                  shipping: {
                    currency_code:
                      "USD",
                    value: (
                      SHIPPING_CENTS /
                      100
                    ).toFixed(2),
                  },
                },
              },
              items: paypalItems,
            },
          ],
        }),
        cache: "no-store",
      }
    );


    const responseText =
      await response.text();


    let data: PayPalCreateOrderResponse =
      {};


    if (responseText) {
      try {
        data =
          JSON.parse(responseText);
      } catch {
        throw new Error(
          "PayPal returned an unreadable response."
        );
      }
    }


    if (
      !response.ok ||
      !data.id
    ) {
      console.error(
        "PayPal create-order error:",
        response.status,
        data
      );


      return NextResponse.json(
        {
          error:
            data.message ||
            "PayPal could not create the order.",
          paypal: data,
        },
        {
          status:
            response.status || 500,
        }
      );
    }


    return NextResponse.json({
      id: data.id,
    });
  } catch (error) {
    console.error(
      "Create PayPal order error:",
      error
    );


    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create PayPal order.",
      },
      { status: 500 }
    );
  }
}
