import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";


import { createClient as createAuthClient } from "@/lib/supabase/server";
import { markOrderFulfilled } from "../actions/actions";
import { logout } from "../login/actions";
import CopyOrderButton from "./CopyOrderButton";


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


type OrderItem = {
  slug?: string;
  size?: string;
  quantity?: number;
};


type Order = {
  id: number;
  created_at: string;
  paypal_order_id: string;
  customer_email: string | null;
  customer_name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country_code: string | null;
  total: number;
  status: string;
  fulfillment_status: string;
  items: OrderItem[] | null;
};


type OrdersPageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};


export const dynamic = "force-dynamic";


export default async function OrdersPage({
  searchParams,
}: OrdersPageProps) {
  const resolvedSearchParams =
    await searchParams;


  const originalSearch =
    resolvedSearchParams.search?.trim() || "";


  const search =
    originalSearch.toLowerCase();


  const supabaseAuth =
    await createAuthClient();


  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();


  const adminEmail =
    process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();


  const signedInEmail =
    user?.email?.trim().toLowerCase();


  if (
    !signedInEmail ||
    !adminEmail ||
    signedInEmail !== adminEmail
  ) {
    redirect("/admin/login");
  }


  const { data, error } =
    await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", {
        ascending: false,
      });


  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#111",
          color: "#f5eadf",
          padding: "40px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h1>
            Orders could not be loaded.
          </h1>


          <p>{error.message}</p>


          <form action={logout}>
            <button
              type="submit"
              style={{
                marginTop: "24px",
                padding: "12px 20px",
                background: "#c79a55",
                color: "#111",
                border: 0,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              LOG OUT
            </button>
          </form>
        </div>
      </main>
    );
  }


  const allOrders =
    (data || []) as Order[];


  const orders = search
    ? allOrders.filter((order) => {
        const searchableText = [
          order.id,
          `order ${order.id}`,
          `order #${order.id}`,
          order.customer_name,
          order.customer_email,
          order.paypal_order_id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();


        return searchableText.includes(search);
      })
    : allOrders;


  const totalOrders = allOrders.length;


  const totalRevenue = allOrders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );


  const newOrders = allOrders.filter(
    (order) =>
      order.fulfillment_status !==
      "fulfilled"
  ).length;


  const fulfilledOrders = allOrders.filter(
    (order) =>
      order.fulfillment_status ===
      "fulfilled"
  ).length;


  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#f5eadf",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "24px",
            flexWrap: "wrap",
            marginBottom: "40px",
          }}
        >
          <div>
            <p
              style={{
                color: "#c79a55",
                letterSpacing: "0.18em",
                fontWeight: 700,
                marginTop: 0,
              }}
            >
              ALLEN MOTION CO.
            </p>


            <h1
              style={{
                fontSize: "48px",
                marginTop: 0,
                marginBottom: "12px",
              }}
            >
              Orders
            </h1>


            <p
              style={{
                color: "#cfc4b8",
                margin: 0,
              }}
            >
              View customer orders and copy
              the shipping information for
              Jean.
            </p>


            <p
              style={{
                color: "#8f857c",
                fontSize: "14px",
                marginTop: "10px",
              }}
            >
              Signed in as {signedInEmail}
            </p>
          </div>


          <form action={logout}>
            <button
              type="submit"
              style={{
                padding: "13px 22px",
                background: "transparent",
                color: "#f5eadf",
                border:
                  "1px solid #c79a55",
                fontWeight: 800,
                letterSpacing: "0.08em",
                cursor: "pointer",
              }}
            >
              LOG OUT
            </button>
          </form>
        </header>


        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "18px",
            marginBottom: "40px",
          }}
        >
          <article
            style={{
              border: "1px solid #5a4632",
              background: "#171717",
              padding: "24px",
            }}
          >
            <p
              style={{
                color: "#8f857c",
                marginTop: 0,
                marginBottom: "10px",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              TOTAL REVENUE
            </p>


            <h2
              style={{
                margin: 0,
                color: "#c79a55",
                fontSize: "32px",
              }}
            >
              ${totalRevenue.toFixed(2)}
            </h2>
          </article>


          <article
            style={{
              border: "1px solid #5a4632",
              background: "#171717",
              padding: "24px",
            }}
          >
            <p
              style={{
                color: "#8f857c",
                marginTop: 0,
                marginBottom: "10px",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              TOTAL ORDERS
            </p>


            <h2
              style={{
                margin: 0,
                fontSize: "32px",
              }}
            >
              {totalOrders}
            </h2>
          </article>


          <article
            style={{
              border: "1px solid #5a4632",
              background: "#171717",
              padding: "24px",
            }}
          >
            <p
              style={{
                color: "#8f857c",
                marginTop: 0,
                marginBottom: "10px",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              NEW ORDERS
            </p>


            <h2
              style={{
                margin: 0,
                color: "#c79a55",
                fontSize: "32px",
              }}
            >
              {newOrders}
            </h2>
          </article>


          <article
            style={{
              border: "1px solid #5a4632",
              background: "#171717",
              padding: "24px",
            }}
          >
            <p
              style={{
                color: "#8f857c",
                marginTop: 0,
                marginBottom: "10px",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              FULFILLED
            </p>


            <h2
              style={{
                margin: 0,
                color: "#8fcf9a",
                fontSize: "32px",
              }}
            >
              {fulfilledOrders}
            </h2>
          </article>
        </section>


        <form
          method="GET"
          action="/admin/orders"
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "30px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="search"
            name="search"
            defaultValue={originalSearch}
            placeholder="Search name, email, PayPal ID, or order number"
            aria-label="Search orders"
            style={{
              flex: "1 1 320px",
              minWidth: 0,
              padding: "14px 16px",
              background: "#171717",
              color: "#f5eadf",
              border:
                "1px solid #5a4632",
              fontSize: "16px",
              outline: "none",
            }}
          />


          <button
            type="submit"
            style={{
              padding: "14px 22px",
              background: "#c79a55",
              color: "#111",
              border: 0,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            SEARCH
          </button>


          {search && (
            <a
              href="/admin/orders"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 22px",
                color: "#f5eadf",
                border:
                  "1px solid #c79a55",
                textDecoration: "none",
                fontWeight: 800,
              }}
            >
              CLEAR
            </a>
          )}
        </form>


        {search && (
          <p
            style={{
              color: "#8f857c",
              marginTop: "-14px",
              marginBottom: "24px",
            }}
          >
            {orders.length} result
            {orders.length === 1 ? "" : "s"} for
            “{originalSearch}”
          </p>
        )}


        {orders.length === 0 ? (
          <div
            style={{
              border: "1px solid #5a4632",
              padding: "28px",
              background: "#171717",
            }}
          >
            {search
              ? "No matching orders found."
              : "No orders yet."}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "24px",
            }}
          >
            {orders.map((order) => {
              const isFulfilled =
                order.fulfillment_status ===
                "fulfilled";


              return (
                <article
                  key={order.id}
                  style={{
                    border:
                      "1px solid #5a4632",
                    padding: "28px",
                    background: "#171717",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "20px",
                      flexWrap: "wrap",
                      marginBottom: "24px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "#c79a55",
                          marginTop: 0,
                          marginBottom: "6px",
                          fontWeight: 700,
                        }}
                      >
                        ORDER #{order.id}
                      </p>


                      <h2
                        style={{
                          margin: 0,
                        }}
                      >
                        {order.customer_name ||
                          "Customer"}
                      </h2>


                      <p>
                        {order.customer_email ||
                          "No email saved"}
                      </p>
                    </div>


                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "24px",
                          fontWeight: 700,
                          margin: 0,
                        }}
                      >
                        $
                        {Number(
                          order.total
                        ).toFixed(2)}
                      </p>


                      <p>
                        {new Date(
                          order.created_at
                        ).toLocaleString()}
                      </p>


                      <p
                        style={{
                          textTransform:
                            "capitalize",
                          color: isFulfilled
                            ? "#8fcf9a"
                            : "#c79a55",
                          fontWeight: 700,
                          marginBottom: "10px",
                        }}
                      >
                        {order.fulfillment_status ||
                          "new"}
                      </p>


                      {!isFulfilled && (
                        <form
                          action={
                            markOrderFulfilled
                          }
                        >
                          <input
                            type="hidden"
                            name="orderId"
                            value={order.id}
                          />


                          <button
                            type="submit"
                            style={{
                              padding:
                                "11px 16px",
                              background:
                                "#c79a55",
                              color: "#111",
                              border: 0,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            MARK FULFILLED
                          </button>
                        </form>
                      )}
                    </div>
                  </div>


                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "24px",
                    }}
                  >
                    <section>
                      <h3>Items</h3>


                      {order.items?.length ? (
                        order.items.map(
                          (item, index) => (
                            <div
                              key={`${item.slug}-${item.size}-${index}`}
                              style={{
                                marginBottom:
                                  "12px",
                              }}
                            >
                              <strong
                                style={{
                                  textTransform:
                                    "capitalize",
                                }}
                              >
                                {item.slug ||
                                  "Unknown product"}
                              </strong>


                              <p
                                style={{
                                  margin: "4px 0",
                                }}
                              >
                                Size:{" "}
                                {item.size ||
                                  "Unknown"}
                              </p>


                              <p
                                style={{
                                  margin: "4px 0",
                                }}
                              >
                                Quantity:{" "}
                                {item.quantity ||
                                  1}
                              </p>
                            </div>
                          )
                        )
                      ) : (
                        <p>
                          No items saved.
                        </p>
                      )}
                    </section>


                    <section>
                      <h3>
                        Shipping address
                      </h3>


                      <p>
                        {order.address_line_1 ||
                          "No address saved"}
                      </p>


                      {order.address_line_2 && (
                        <p>
                          {
                            order.address_line_2
                          }
                        </p>
                      )}


                      <p>
                        {[
                          order.city,
                          order.state,
                          order.postal_code,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>


                      <p>
                        {order.country_code}
                      </p>


                      <CopyOrderButton
                        orderId={order.id}
                        customerName={
                          order.customer_name
                        }
                        customerEmail={
                          order.customer_email
                        }
                        addressLine1={
                          order.address_line_1
                        }
                        addressLine2={
                          order.address_line_2
                        }
                        city={order.city}
                        state={order.state}
                        postalCode={
                          order.postal_code
                        }
                        countryCode={
                          order.country_code
                        }
                        items={order.items}
                      />
                    </section>


                    <section>
                      <h3>Payment</h3>


                      <p>PayPal ID:</p>


                      <p
                        style={{
                          wordBreak:
                            "break-word",
                        }}
                      >
                        {
                          order.paypal_order_id
                        }
                      </p>


                      <p>
                        Status:{" "}
                        <strong
                          style={{
                            textTransform:
                              "capitalize",
                          }}
                        >
                          {order.status}
                        </strong>
                      </p>
                    </section>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
