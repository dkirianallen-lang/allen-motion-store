import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
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


const resendApiKey =
  process.env.RESEND_API_KEY;


const orderNotificationEmail =
  process.env.ORDER_NOTIFICATION_EMAIL;


const customerEmailTestMode =
  process.env.CUSTOMER_EMAIL_TEST_MODE ===
  "true";


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


const resend = resendApiKey
  ? new Resend(resendApiKey)
  : null;


type CartItem = {
  slug: string;
  size: string;
  quantity: number;
};


type PayPalAddress = {
  address_line_1?: string;
  address_line_2?: string;
  admin_area_2?: string;
  admin_area_1?: string;
  postal_code?: string;
  country_code?: string;
};


type PayPalCaptureResponse = {
  status?: string;


  payer?: {
    email_address?: string;


    name?: {
      given_name?: string;
      surname?: string;
    };
  };


  payment_source?: {
    paypal?: {
      email_address?: string;


      name?: {
        given_name?: string;
        surname?: string;
      };
    };
  };


  purchase_units?: Array<{
    amount?: {
      value?: string;
    };


    shipping?: {
      name?: {
        full_name?: string;
      };


      address?: PayPalAddress;
    };


    payments?: {
      captures?: Array<{
        status?: string;


        amount?: {
          value?: string;
        };
      }>;
    };
  }>;
};


const productNames: Record<string, string> = {
  black:
    "ASCEND Track Graphic Tee — Vintage Black",


  gray:
    "ASCEND Track Graphic Tee — Vintage Gray",


  cream:
    "ASCEND Track Graphic Tee — Cream",
};


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


function combineName(
  givenName?: string,
  surname?: string
) {
  const fullName = [
    givenName,
    surname,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();


  return fullName || null;
}


function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function buildItemRows(cart: CartItem[]) {
  return cart
    .map((item) => {
      const productName =
        productNames[item.slug] ||
        item.slug;


      return `
        <tr>
          <td
            style="
              padding:12px;
              border:1px solid #dddddd;
            "
          >
            ${escapeHtml(productName)}
          </td>


          <td
            style="
              padding:12px;
              border:1px solid #dddddd;
            "
          >
            ${escapeHtml(item.size)}
          </td>


          <td
            style="
              padding:12px;
              border:1px solid #dddddd;
              text-align:center;
            "
          >
            ${escapeHtml(item.quantity)}
          </td>
        </tr>
      `;
    })
    .join("");
}


export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();


    const orderID = body.orderID as
      | string
      | undefined;


    const cart = body.cart as
      | CartItem[]
      | undefined;


    if (!orderID) {
      return NextResponse.json(
        {
          error:
            "Missing PayPal order ID.",
        },
        { status: 400 }
      );
    }


    if (
      !Array.isArray(cart) ||
      cart.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing purchased cart items.",
        },
        { status: 400 }
      );
    }


    for (const item of cart) {
      if (
        !item.slug ||
        !item.size ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid purchased cart item.",
          },
          { status: 400 }
        );
      }
    }


    const accessToken =
      await getAccessToken();


    const response = await fetch(
      `${paypalBase}/v2/checkout/orders/${orderID}/capture`,
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


        cache: "no-store",
      }
    );


    const responseText =
      await response.text();


    let paypalData: PayPalCaptureResponse =
      {};


    if (responseText) {
      try {
        paypalData =
          JSON.parse(responseText);
      } catch {
        throw new Error(
          "PayPal returned an unreadable response."
        );
      }
    }


    if (!response.ok) {
      console.error(
        "PayPal capture failed:",
        response.status,
        paypalData
      );


      return NextResponse.json(
        {
          error:
            "PayPal payment could not be captured.",


          paypal: paypalData,
        },
        { status: response.status }
      );
    }


    const purchaseUnit =
      paypalData.purchase_units?.[0];


    const capture =
      purchaseUnit?.payments
        ?.captures?.[0];


    if (capture?.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error:
            "PayPal payment was not completed.",


          paypalStatus:
            capture?.status ||
            paypalData.status ||
            "UNKNOWN",
        },
        { status: 409 }
      );
    }


    const paypalSource =
      paypalData.payment_source?.paypal;


    const customerEmail =
      paypalSource?.email_address ||
      paypalData.payer?.email_address ||
      null;


    const customerName =
      purchaseUnit?.shipping?.name
        ?.full_name ||
      combineName(
        paypalSource?.name?.given_name,
        paypalSource?.name?.surname
      ) ||
      combineName(
        paypalData.payer?.name?.given_name,
        paypalData.payer?.name?.surname
      );


    const shippingAddress =
      purchaseUnit?.shipping?.address;


    const totalValue =
      capture.amount?.value ||
      purchaseUnit?.amount?.value;


    const total = Number(totalValue);


    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      throw new Error(
        "PayPal returned an invalid total."
      );
    }


    const { error: databaseError } =
      await supabaseAdmin.rpc(
        "complete_paid_order_with_shipping",
        {
          p_paypal_order_id: orderID,


          p_customer_email:
            customerEmail,


          p_customer_name:
            customerName,


          p_address_line_1:
            shippingAddress
              ?.address_line_1 || null,


          p_address_line_2:
            shippingAddress
              ?.address_line_2 || null,


          p_city:
            shippingAddress
              ?.admin_area_2 || null,


          p_state:
            shippingAddress
              ?.admin_area_1 || null,


          p_postal_code:
            shippingAddress
              ?.postal_code || null,


          p_country_code:
            shippingAddress
              ?.country_code || null,


          p_total: total,


          p_items: cart,
        }
      );


    if (databaseError) {
      console.error(
        "Order completion database error:",
        databaseError
      );


      throw new Error(
        `Payment completed, but the order could not be saved: ${databaseError.message}`
      );
    }


    const itemRows =
      buildItemRows(cart);


    const cityStatePostal = [
      shippingAddress?.admin_area_2,
      shippingAddress?.admin_area_1,
      shippingAddress?.postal_code,
    ]
      .filter(Boolean)
      .join(", ");


    /*
     * Owner notification email
     */
    if (
      resend &&
      orderNotificationEmail
    ) {
      const {
        data: emailData,
        error: emailError,
      } = await resend.emails.send({
        from:
          "Allen Motion Store <orders@allenmotion.vip>",


        to: [orderNotificationEmail],


        subject:
          `New Allen Motion order — $${total.toFixed(
            2
          )}`,


        html: `
          <div
            style="
              font-family:Arial,sans-serif;
              max-width:650px;
              margin:0 auto;
              color:#171717;
            "
          >
            <div
              style="
                background:#111111;
                color:#f5eadf;
                padding:28px;
              "
            >
              <p
                style="
                  color:#c79a55;
                  letter-spacing:3px;
                  font-weight:700;
                  margin-top:0;
                "
              >
                ALLEN MOTION CO.
              </p>


              <h1 style="margin-bottom:8px;">
                New paid order
              </h1>


              <p style="margin-bottom:0;">
                A customer completed checkout.
              </p>
            </div>


            <div
              style="
                border:1px solid #dddddd;
                border-top:0;
                padding:28px;
              "
            >
              <h2>Order information</h2>


              <p>
                <strong>PayPal order ID:</strong>
                <br />


                ${escapeHtml(orderID)}
              </p>


              <p>
                <strong>Total paid:</strong>
                <br />


                $${total.toFixed(2)}
              </p>


              <p>
                <strong>Customer:</strong>
                <br />


                ${escapeHtml(
                  customerName || "Customer"
                )}
              </p>


              <p>
                <strong>Email:</strong>
                <br />


                ${escapeHtml(
                  customerEmail ||
                    "No email saved"
                )}
              </p>


              <h2 style="margin-top:30px;">
                Items
              </h2>


              <table
                style="
                  width:100%;
                  border-collapse:collapse;
                "
              >
                <thead>
                  <tr>
                    <th
                      style="
                        padding:12px;
                        border:1px solid #dddddd;
                        text-align:left;
                        background:#f4f4f4;
                      "
                    >
                      Product
                    </th>


                    <th
                      style="
                        padding:12px;
                        border:1px solid #dddddd;
                        text-align:left;
                        background:#f4f4f4;
                      "
                    >
                      Size
                    </th>


                    <th
                      style="
                        padding:12px;
                        border:1px solid #dddddd;
                        text-align:center;
                        background:#f4f4f4;
                      "
                    >
                      Quantity
                    </th>
                  </tr>
                </thead>


                <tbody>
                  ${itemRows}
                </tbody>
              </table>


              <h2 style="margin-top:30px;">
                Shipping address
              </h2>


              <p style="line-height:1.7;">
                ${escapeHtml(
                  customerName || "Customer"
                )}
                <br />


                ${escapeHtml(
                  shippingAddress
                    ?.address_line_1 ||
                    "No address saved"
                )}
                <br />


                ${
                  shippingAddress
                    ?.address_line_2
                    ? `${escapeHtml(
                        shippingAddress
                          .address_line_2
                      )}<br />`
                    : ""
                }


                ${escapeHtml(
                  cityStatePostal
                )}
                <br />


                ${escapeHtml(
                  shippingAddress
                    ?.country_code || ""
                )}
              </p>


              <p
                style="
                  margin-top:30px;
                  padding:16px;
                  background:#f4f4f4;
                "
              >
                Sign in to your Allen Motion
                Orders dashboard to copy this
                information for Gene and manage
                the order.
              </p>
            </div>
          </div>
        `,
      });


      if (emailError) {
        console.error(
          "Order notification email failed:",
          emailError
        );
      } else {
        console.log(
          "Order notification email sent:",
          emailData?.id
        );
      }
    } else {
      console.warn(
        "Order email skipped because RESEND_API_KEY or ORDER_NOTIFICATION_EMAIL is missing."
      );
    }


    /*
     * Customer confirmation email
     *
     * In test mode, it sends to your owner
     * notification email instead of the fake
     * PayPal Sandbox buyer email.
     */
    const customerConfirmationRecipient =
      customerEmailTestMode
        ? orderNotificationEmail
        : customerEmail;


    if (
      resend &&
      customerConfirmationRecipient
    ) {
      const {
        data: customerEmailData,
        error: customerEmailError,
      } = await resend.emails.send({
        from:
          "Allen Motion Store <orders@allenmotion.vip>",


        to: [
          customerConfirmationRecipient,
        ],


        subject:
          `Your Allen Motion order is confirmed — ${orderID}`,


        html: `
          <div
            style="
              font-family:Arial,sans-serif;
              max-width:650px;
              margin:0 auto;
              color:#171717;
              background:#ffffff;
            "
          >
            <div
              style="
                background:#111111;
                color:#f5eadf;
                padding:32px;
              "
            >
              <p
                style="
                  color:#c79a55;
                  letter-spacing:3px;
                  font-weight:700;
                  margin-top:0;
                "
              >
                ALLEN MOTION CO.
              </p>


              <h1
                style="
                  margin-bottom:10px;
                  font-size:34px;
                "
              >
                Order confirmed.
              </h1>


              <p
                style="
                  margin-bottom:0;
                  line-height:1.6;
                "
              >
                Thank you for your purchase,
                ${escapeHtml(
                  customerName || "Customer"
                )}.
              </p>
            </div>


            <div
              style="
                border:1px solid #dddddd;
                border-top:0;
                padding:30px;
              "
            >
              ${
                customerEmailTestMode
                  ? `
                    <p
                      style="
                        background:#fff4d6;
                        border:1px solid #e0b867;
                        padding:14px;
                      "
                    >
                      <strong>
                        Test mode:
                      </strong>


                      This customer confirmation
                      was sent to the store owner.
                    </p>
                  `
                  : ""
              }


              <p
                style="
                  font-size:17px;
                  line-height:1.6;
                "
              >
                We received your payment and
                your order is now being prepared.
              </p>


              <h2
                style="
                  margin-top:30px;
                  margin-bottom:10px;
                "
              >
                Order details
              </h2>


              <p>
                <strong>Order ID:</strong>
                <br />


                ${escapeHtml(orderID)}
              </p>


              <p>
                <strong>Total paid:</strong>
                <br />


                $${total.toFixed(2)}
              </p>


              <table
                style="
                  width:100%;
                  border-collapse:collapse;
                  margin-top:24px;
                "
              >
                <thead>
                  <tr
                    style="
                      background:#f3f3f3;
                    "
                  >
                    <th
                      style="
                        padding:12px;
                        text-align:left;
                        border:1px solid #dddddd;
                      "
                    >
                      Product
                    </th>


                    <th
                      style="
                        padding:12px;
                        text-align:left;
                        border:1px solid #dddddd;
                      "
                    >
                      Size
                    </th>


                    <th
                      style="
                        padding:12px;
                        text-align:center;
                        border:1px solid #dddddd;
                      "
                    >
                      Quantity
                    </th>
                  </tr>
                </thead>


                <tbody>
                  ${itemRows}
                </tbody>
              </table>


              <h2
                style="
                  margin-top:32px;
                  margin-bottom:10px;
                "
              >
                Shipping address
              </h2>


              <p style="line-height:1.7;">
                ${escapeHtml(
                  customerName || "Customer"
                )}
                <br />


                ${escapeHtml(
                  shippingAddress
                    ?.address_line_1 ||
                    "No address saved"
                )}
                <br />


                ${
                  shippingAddress
                    ?.address_line_2
                    ? `${escapeHtml(
                        shippingAddress
                          .address_line_2
                      )}<br />`
                    : ""
                }


                ${escapeHtml(
                  cityStatePostal
                )}
                <br />


                ${escapeHtml(
                  shippingAddress
                    ?.country_code || ""
                )}
              </p>


              <div
                style="
                  margin-top:32px;
                  padding:18px;
                  background:#f3f3f3;
                  line-height:1.6;
                "
              >
                <strong>
                  What happens next?
                </strong>


                <p style="margin-bottom:0;">
                  Your order will be prepared
                  for shipment. Tracking
                  information will be provided
                  once your order ships.
                </p>
              </div>


              <p
                style="
                  margin-top:30px;
                  color:#6b6b6b;
                  font-size:14px;
                  line-height:1.6;
                "
              >
                This email confirms that your
                payment was received. Keep it
                for your records.
              </p>
            </div>
          </div>
        `,
      });


      if (customerEmailError) {
        console.error(
          "Customer confirmation email failed:",
          customerEmailError
        );
      } else {
        console.log(
          "Customer confirmation email sent:",
          customerEmailData?.id
        );
      }
    } else {
      console.warn(
        "Customer confirmation skipped because the recipient or Resend setup is missing."
      );
    }


    return NextResponse.json({
      success: true,
      orderID,
      status: "COMPLETED",
      customerEmail,
      customerName,
      shippingAddress,
      total,
      items: cart,
    });
  } catch (error) {
    console.error(
      "Capture PayPal order error:",
      error
    );


    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to complete the PayPal order.",
      },
      { status: 500 }
    );
  }
}
