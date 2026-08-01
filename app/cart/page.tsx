"use client";


import Link from "next/link";
import {
  PayPalButtons,
  PayPalScriptProvider,
} from "@paypal/react-paypal-js";
import { useEffect, useState } from "react";


type CartItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
  availableQuantity?: number;
};


type ApiResponse = {
  id?: string;
  success?: boolean;
  error?: string | Record<string, unknown>;
};


const SHIPPING_COST = 9.99;


export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);


  const [checkoutMessage, setCheckoutMessage] =
    useState("");


  const [paymentComplete, setPaymentComplete] =
    useState(false);


  const paypalClientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";


  useEffect(() => {
    try {
      const savedCart = JSON.parse(
        localStorage.getItem("allenMotionCart") || "[]"
      );


      setCart(
        Array.isArray(savedCart) ? savedCart : []
      );
    } catch {
      setCart([]);
      localStorage.removeItem("allenMotionCart");
    } finally {
      setLoaded(true);
    }
  }, []);


  function saveCart(updatedCart: CartItem[]) {
    setCart(updatedCart);


    localStorage.setItem(
      "allenMotionCart",
      JSON.stringify(updatedCart)
    );


    window.dispatchEvent(
      new Event("cart-updated")
    );
  }


  function increaseQuantity(index: number) {
    const updatedCart = cart.map((item) => ({
      ...item,
    }));


    const item = updatedCart[index];


    if (!item) {
      return;
    }


    if (
      typeof item.availableQuantity === "number" &&
      item.quantity >= item.availableQuantity
    ) {
      setCheckoutMessage(
        `Only ${item.availableQuantity} of that size is available.`
      );


      return;
    }


    item.quantity += 1;


    setCheckoutMessage("");
    saveCart(updatedCart);
  }


  function decreaseQuantity(index: number) {
    const updatedCart = cart.map((item) => ({
      ...item,
    }));


    const item = updatedCart[index];


    if (!item) {
      return;
    }


    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      updatedCart.splice(index, 1);
    }


    setCheckoutMessage("");
    saveCart(updatedCart);
  }


  function removeItem(index: number) {
    const updatedCart = cart.filter(
      (_, itemIndex) => itemIndex !== index
    );


    setCheckoutMessage("");
    saveCart(updatedCart);
  }


  async function readJsonResponse(
    response: Response
  ): Promise<ApiResponse> {
    const responseText = await response.text();


    if (!responseText) {
      return {};
    }


    try {
      return JSON.parse(
        responseText
      ) as ApiResponse;
    } catch {
      return {
        error:
          "The server returned an unreadable response.",
      };
    }
  }


  function getErrorMessage(
    error: ApiResponse["error"],
    fallback: string
  ) {
    return typeof error === "string"
      ? error
      : fallback;
  }


  const subtotal = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );


  const shipping =
    cart.length > 0 ? SHIPPING_COST : 0;


  const total = subtotal + shipping;


  const totalItemCount = cart.reduce(
    (totalQuantity, item) =>
      totalQuantity + item.quantity,
    0
  );


  if (!loaded) {
    return (
      <main className="cartLoading">
        <p>Loading your cart...</p>
      </main>
    );
  }


  return (
    <main className="cartPage">
      <header className="cartHeader">
        <Link href="/" className="backLink">
          ← Continue shopping
        </Link>


        <img
          src="/allen-motion-logo.png"
          alt="Allen Motion Co."
          className="productLogo"
        />


        <span className="cartHeaderLabel">
          CART ({totalItemCount})
        </span>
      </header>


      <section className="cartContainer">
        <div className="cartTitle">
          <p className="sectionLabel">
            YOUR SELECTION
          </p>


          <h1>SHOPPING CART</h1>
        </div>


        {paymentComplete ? (
          <div className="emptyCart">
            <h2>Payment approved.</h2>


            <p>
              Your Sandbox test order was completed
              successfully.
            </p>


            <Link href="/" className="shopButton">
              RETURN HOME
            </Link>
          </div>
        ) : cart.length === 0 ? (
          <div className="emptyCart">
            <h2>Your cart is empty.</h2>


            <p>
              Your next ASCEND piece is waiting.
            </p>


            <Link
              href="/#products"
              className="shopButton"
            >
              SHOP THE COLLECTION
            </Link>
          </div>
        ) : (
          <div className="cartLayout">
            <div className="cartItems">
              {cart.map((item, index) => (
                <article
                  className="cartItem"
                  key={`${item.slug}-${item.size}`}
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="cartItemImage"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                    />
                  </Link>


                  <div className="cartItemDetails">
                    <p className="cartItemCollection">
                      ASCEND COLLECTION
                    </p>


                    <h2>{item.name}</h2>


                    <p>
                      Color:{" "}
                      <strong>{item.color}</strong>
                    </p>


                    <p>
                      Size:{" "}
                      <strong>{item.size}</strong>
                    </p>


                    <p className="cartItemPrice">
                      ${item.price.toFixed(2)}
                    </p>


                    <div className="quantityControls">
                      <button
                        type="button"
                        onClick={() =>
                          decreaseQuantity(index)
                        }
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>


                      <span>{item.quantity}</span>


                      <button
                        type="button"
                        onClick={() =>
                          increaseQuantity(index)
                        }
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>


                    <button
                      type="button"
                      className="removeItemButton"
                      onClick={() =>
                        removeItem(index)
                      }
                    >
                      Remove
                    </button>
                  </div>


                  <p className="cartItemTotal">
                    $
                    {(
                      item.price * item.quantity
                    ).toFixed(2)}
                  </p>
                </article>
              ))}
            </div>


            <aside className="orderSummary">
              <p className="sectionLabel">
                ORDER SUMMARY
              </p>


              <div className="summaryRow">
                <span>Subtotal</span>


                <span>
                  ${subtotal.toFixed(2)}
                </span>
              </div>


              <div className="summaryRow">
                <span>U.S. shipping</span>


                <span>
                  ${shipping.toFixed(2)}
                </span>
              </div>


              <div className="summaryDivider" />


              <div className="summaryRow summaryTotal">
                <span>Total</span>


                <span>
                  ${total.toFixed(2)}
                </span>
              </div>


              {!paypalClientId ? (
                <p className="cartMessage">
                  PayPal Client ID is missing.
                </p>
              ) : (
                <PayPalScriptProvider
                  options={{
                    clientId: paypalClientId,
                    currency: "USD",
                    intent: "capture",
                  }}
                >
                  <PayPalButtons
                    style={{
                      layout: "vertical",
                      shape: "rect",
                      label: "paypal",
                    }}
                    forceReRender={[
                      JSON.stringify(cart),
                      total,
                    ]}
                    createOrder={async () => {
                      setCheckoutMessage("");


                      const response = await fetch(
                        "/api/paypal/create-order",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type":
                              "application/json",
                          },
                          body: JSON.stringify({
                            cart: cart.map((item) => ({
                              slug: item.slug,
                              size: item.size,
                              quantity:
                                item.quantity,
                            })),
                          }),
                        }
                      );


                      const responseData =
                        await readJsonResponse(
                          response
                        );


                      if (
                        !response.ok ||
                        !responseData.id
                      ) {
                        const errorMessage =
                          getErrorMessage(
                            responseData.error,
                            "Unable to create PayPal order."
                          );


                        setCheckoutMessage(
                          errorMessage
                        );


                        throw new Error(
                          errorMessage
                        );
                      }


                      return responseData.id;
                    }}
                    onApprove={async (data) => {
                      setCheckoutMessage(
                        "Finalizing payment..."
                      );


                      const response = await fetch(
                        "/api/paypal/capture-order",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type":
                              "application/json",
                          },
                          body: JSON.stringify({
                            orderID: data.orderID,


                            cart: cart.map((item) => ({
                              slug: item.slug,
                              size: item.size,
                              quantity:
                                item.quantity,
                            })),
                          }),
                        }
                      );


                      const captureData =
                        await readJsonResponse(
                          response
                        );


                      if (
                        !response.ok ||
                        captureData.success === false
                      ) {
                        const errorMessage =
                          getErrorMessage(
                            captureData.error,
                            "Payment could not be completed."
                          );


                        setCheckoutMessage(
                          errorMessage
                        );


                        throw new Error(
                          errorMessage
                        );
                      }


                      localStorage.removeItem(
                        "allenMotionCart"
                      );


                      window.dispatchEvent(
                        new Event("cart-updated")
                      );


                      setCart([]);
                      setCheckoutMessage("");
                      setPaymentComplete(true);
                    }}
                    onCancel={() => {
                      setCheckoutMessage(
                        "Checkout was canceled. Your cart is still saved."
                      );
                    }}
                    onError={(error) => {
                      console.error(
                        "PayPal checkout error:",
                        error
                      );


                      setCheckoutMessage(
                        "PayPal checkout could not be completed. Please try again."
                      );
                    }}
                  />
                </PayPalScriptProvider>
              )}


              {checkoutMessage && (
                <p className="cartMessage">
                  {checkoutMessage}
                </p>
              )}


              <p className="secureCheckoutText">
                Sandbox test checkout powered by PayPal
              </p>


              <Link
                href="/#products"
                className="continueShoppingLink"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
