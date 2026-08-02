"use client";


import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


type Product = {
  name: string;
  shortName: string;
  price: number;
  frontImage: string;
  backImage: string;
  color: string;
};


type InventoryRow = {
  size: string;
  quantity: number;
};


type StoredCartItem = {
  slug?: string;
  size?: string;
  quantity?: number;
};


const products: Record<string, Product> = {
  gray: {
    name: "ASCEND TRACK GRAPHIC TEE — VINTAGE GRAY",
    shortName: "Vintage Gray",
    price: 39.99,
    frontImage: "/gray-shirt.png",
    backImage: "/gray-shirt-back.png",
    color: "Vintage Gray",
  },


  black: {
    name: "ASCEND TRACK GRAPHIC TEE — VINTAGE BLACK",
    shortName: "Vintage Black",
    price: 39.99,
    frontImage: "/black-shirt.png",
    backImage: "/black-shirt-back.png",
    color: "Vintage Black",
  },


  cream: {
    name: "ASCEND TRACK GRAPHIC TEE — CREAM",
    shortName: "Cream",
    price: 39.99,
    frontImage: "/cream-shirt.png",
    backImage: "/cream-shirt-back.png",
    color: "Cream",
  },
};


const sizeOrder = [
  "Adult Small",
  "Adult Medium",
  "Adult Large",
];


export default function ProductPage() {
  const params = useParams();
  const slug = String(params.slug);
  const product = products[slug];


  const [inventory, setInventory] =
    useState<InventoryRow[]>([]);


  const [selectedSize, setSelectedSize] =
    useState("");


  const [message, setMessage] =
    useState("");


  const [loadingInventory, setLoadingInventory] =
    useState(true);


  const [inventoryError, setInventoryError] =
    useState("");


  const [cartCount, setCartCount] =
    useState(0);


  function updateCartCount() {
    try {
      const savedCart = JSON.parse(
        localStorage.getItem(
          "allenMotionCart"
        ) || "[]"
      );


      if (!Array.isArray(savedCart)) {
        setCartCount(0);
        return;
      }


      const totalQuantity = savedCart.reduce(
        (
          total: number,
          item: StoredCartItem
        ) => {
          const quantity = Number(
            item.quantity
          );


          return (
            total +
            (Number.isFinite(quantity)
              ? quantity
              : 0)
          );
        },
        0
      );


      setCartCount(totalQuantity);
    } catch {
      setCartCount(0);


      localStorage.removeItem(
        "allenMotionCart"
      );
    }
  }


  useEffect(() => {
    updateCartCount();


    window.addEventListener(
      "cart-updated",
      updateCartCount
    );


    window.addEventListener(
      "storage",
      updateCartCount
    );


    return () => {
      window.removeEventListener(
        "cart-updated",
        updateCartCount
      );


      window.removeEventListener(
        "storage",
        updateCartCount
      );
    };
  }, []);


  useEffect(() => {
    if (!product) {
      setLoadingInventory(false);
      return;
    }


    async function loadInventory() {
      setLoadingInventory(true);
      setInventoryError("");


      const { data, error } = await supabase
        .from("inventory")
        .select("size, quantity")
        .eq("product_slug", slug);


      if (error) {
        console.error(
          "Inventory error:",
          error
        );


        setInventoryError(
          "Inventory could not be loaded."
        );


        setLoadingInventory(false);
        return;
      }


      const sortedInventory = (
        data || []
      ).sort(
        (
          firstItem,
          secondItem
        ) =>
          sizeOrder.indexOf(
            firstItem.size
          ) -
          sizeOrder.indexOf(
            secondItem.size
          )
      );


      setInventory(sortedInventory);
      setLoadingInventory(false);
    }


    loadInventory();
  }, [slug, product]);


  if (!product) {
    return (
      <main className="productNotFound">
        <h1>Product not found</h1>


        <Link href="/">
          Return home
        </Link>
      </main>
    );
  }


  function handleAddToCart() {
    if (!selectedSize) {
      setMessage(
        "Please select a size first."
      );


      return;
    }


    const selectedInventory =
      inventory.find(
        (item) =>
          item.size === selectedSize
      );


    if (
      !selectedInventory ||
      selectedInventory.quantity <= 0
    ) {
      setMessage(
        "That size is sold out."
      );


      return;
    }


    let existingCart: StoredCartItem[] = [];


    try {
      const parsedCart = JSON.parse(
        localStorage.getItem(
          "allenMotionCart"
        ) || "[]"
      );


      existingCart = Array.isArray(
        parsedCart
      )
        ? parsedCart
        : [];
    } catch {
      existingCart = [];


      localStorage.removeItem(
        "allenMotionCart"
      );
    }


    const matchingItemIndex =
      existingCart.findIndex(
        (item) =>
          item.slug === slug &&
          item.size === selectedSize
      );


    const currentCartQuantity =
      matchingItemIndex >= 0
        ? Number(
            existingCart[
              matchingItemIndex
            ].quantity || 0
          )
        : 0;


    if (
      currentCartQuantity >=
      selectedInventory.quantity
    ) {
      setMessage(
        `Only ${selectedInventory.quantity} of this size is available.`
      );


      return;
    }


    const cartItem = {
      slug,
      name: product.name,
      price: product.price,
      image: product.frontImage,
      color: product.color,
      size: selectedSize,
      quantity: 1,
      availableQuantity:
        selectedInventory.quantity,
    };


    if (matchingItemIndex >= 0) {
      existingCart[
        matchingItemIndex
      ].quantity =
        currentCartQuantity + 1;


      (
        existingCart[
          matchingItemIndex
        ] as StoredCartItem & {
          availableQuantity?: number;
        }
      ).availableQuantity =
        selectedInventory.quantity;
    } else {
      existingCart.push(cartItem);
    }


    localStorage.setItem(
      "allenMotionCart",
      JSON.stringify(existingCart)
    );


    window.dispatchEvent(
      new Event("cart-updated")
    );


    updateCartCount();


    setMessage(
      `Added ${product.shortName}, ${selectedSize}, to your cart.`
    );
  }


  return (
    <main className="productPage">
      <header className="productHeader">
        <Link
          href="/"
          className="backLink"
        >
          ← Back to collection
        </Link>


        <img
          src="/allen-motion-logo.png"
          alt="Allen Motion Co."
          className="productLogo"
        />


        <Link
          href="/cart"
          className="productCartLink"
          aria-label={`Shopping cart with ${cartCount} item${
            cartCount === 1 ? "" : "s"
          }`}
        >
          CART ({cartCount})
        </Link>
      </header>


      <section className="productLayout">
        <div className="productPhotoArea">
          <div className="productImageView">
            <p className="productImageLabel">
              Front
            </p>


            <img
              src={product.frontImage}
              alt={`${product.name} front view`}
              className="productMainImage"
            />
          </div>


          <div className="productImageView">
            <p className="productImageLabel">
              Back
            </p>


            <img
              src={product.backImage}
              alt={`${product.name} back view`}
              className="productMainImage"
            />
          </div>
        </div>


        <div className="productDetails">
          <p className="productCollectionLabel">
            ASCEND COLLECTION
          </p>


          <h1>{product.name}</h1>


          <p className="productPrice">
            ${product.price.toFixed(2)}
          </p>


          <div className="productStory">
            <p className="productTagline">
              More than a shirt. A reminder
              of who you’re becoming.
            </p>


            <p>
              <strong>
                The ASCEND Oversized Tee
              </strong>{" "}
              was created for people who
              choose progress over comfort
              and purpose over excuses.
            </p>


            <p>
              Every detail, from the
              oversized fit to the
              vintage-wash finish,
              represents the journey of
              becoming stronger every day.
              Designed for the gym, the
              track, campus, or everyday
              life, this heavyweight tee
              delivers premium comfort
              while carrying a message that
              goes beyond fashion.
            </p>


            <p>
              The back graphic symbolizes
              the road to growth. The globe
              represents limitless
              potential, and every step
              forward is a reminder that
              your journey can inspire more
              than just yourself.
            </p>


            <p>
              Built for those who rise
              every day.
            </p>
          </div>


          <div className="productFacts">
            <h2>Details</h2>


            <p>
              Premium heavyweight cotton
            </p>


            <p>
              Oversized streetwear fit
            </p>


            <p>
              Vintage-wash finish
            </p>


            <p>
              High-quality DTF print
            </p>


            <p>
              Soft feel with durable
              construction
            </p>


            <p>
              Created to inspire
              discipline, purpose, and
              growth
            </p>
          </div>


          <div className="sizeSection">
            <div className="sizeHeading">
              <h2>Select size</h2>
            </div>


            {loadingInventory && (
              <p className="cartMessage">
                Loading available sizes...
              </p>
            )}


            {inventoryError && (
              <p className="cartMessage">
                {inventoryError}
              </p>
            )}


            {!loadingInventory &&
              !inventoryError &&
              inventory.length === 0 && (
                <p className="cartMessage">
                  No inventory is
                  available for this
                  product.
                </p>
              )}


            <div className="sizeButtons">
              {inventory.map(
                ({
                  size,
                  quantity,
                }) => (
                  <button
                    key={size}
                    type="button"
                    disabled={
                      quantity === 0
                    }
                    className={
                      selectedSize === size
                        ? "sizeActive"
                        : ""
                    }
                    onClick={() => {
                      setSelectedSize(
                        size
                      );


                      setMessage("");
                    }}
                  >
                    <span>{size}</span>


                    <small>
                      {quantity > 0
                        ? `${quantity} available`
                        : "Sold out"}
                    </small>
                  </button>
                )
              )}
            </div>
          </div>


          <button
            type="button"
            className="addToCartButton"
            onClick={handleAddToCart}
            disabled={
              loadingInventory ||
              Boolean(inventoryError) ||
              inventory.length === 0
            }
          >
            ADD TO CART — $
            {product.price.toFixed(2)}
          </button>


          {message && (
            <p className="cartMessage">
              {message}
            </p>
          )}


          <div className="shippingNotice">
            <strong>Shipping</strong>


            <p>
              $9.99 U.S. shipping. Please allow
              7–15 business days for delivery.
              Tracking will be provided when
              your order ships.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
