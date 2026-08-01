"use client";


import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";


type StoredCartItem = {
  quantity?: number;
};


const products = [
  {
    id: 1,
    slug: "gray",
    name:
      "ASCEND TRACK GRAPHIC TEE — VINTAGE GRAY",
    price: 49.99,
    image: "/gray-shirt.png",
  },
  {
    id: 2,
    slug: "black",
    name:
      "ASCEND TRACK GRAPHIC TEE — VINTAGE BLACK",
    price: 49.99,
    image: "/black-shirt.png",
  },
  {
    id: 3,
    slug: "cream",
    name:
      "ASCEND TRACK GRAPHIC TEE — CREAM",
    price: 49.99,
    image: "/cream-shirt.png",
  },
];


export default function Home() {
  const [menuOpen, setMenuOpen] =
    useState(false);


  const [cartCount, setCartCount] =
    useState(0);


  useEffect(() => {
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


        const totalQuantity =
          savedCart.reduce(
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


  function closeMenu() {
    setMenuOpen(false);
  }


  return (
    <main className="site">
      <header className="header">
        <button
          type="button"
          className="menuButton"
          onClick={() =>
            setMenuOpen(
              (currentValue) =>
                !currentValue
            )
          }
          aria-label={
            menuOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={menuOpen}
        >
          ☰
        </button>


        <div className="brand">
          <Link
            href="/"
            aria-label="Allen Motion Co. homepage"
          >
            <img
              src="/allen-motion-logo.png"
              alt="Allen Motion Co."
              className="brandLogo"
            />
          </Link>
        </div>


        <Link
          href="/cart"
          className="cartButton"
          aria-label={`Shopping cart with ${cartCount} item${
            cartCount === 1 ? "" : "s"
          }`}
        >
          CART <span>{cartCount}</span>
        </Link>
      </header>


      {menuOpen && (
        <nav className="mobileMenu">
          <a
            href="#products"
            onClick={closeMenu}
          >
            Products
          </a>


          <a
            href="#mission"
            onClick={closeMenu}
          >
            The Mission
          </a>


          <a
            href="#owner"
            onClick={closeMenu}
          >
            About Owner
          </a>


          <a
            href="#contact"
            onClick={closeMenu}
          >
            Contact
          </a>


          <Link
            href="/cart"
            onClick={closeMenu}
          >
            Cart ({cartCount})
          </Link>
        </nav>
      )}


      <nav className="desktopNav">
        <a href="#products">Products</a>


        <a href="#mission">
          The Mission
        </a>


        <a href="#owner">
          About Owner
        </a>


        <a href="#contact">
          Contact
        </a>


        <Link href="/cart">
          Cart ({cartCount})
        </Link>
      </nav>


      <section className="hero">
        <div className="track trackOne" />
        <div className="track trackTwo" />
        <div className="track trackThree" />


        <div className="runner">
          🏃🏾‍♂️
        </div>


        <div className="heroContent">
          <p className="eyebrow">
            ALLEN MOTION CO. PRESENTS
          </p>


          <h2>ASCEND</h2>


          <h3>
            BUILT FOR THOSE WHO KEEP
            GOING.
          </h3>


          <div className="goldLine" />


          <p className="heroText">
            From doubt to discipline. From
            pressure to purpose.
          </p>


          <a
            href="#products"
            className="shopButton"
          >
            SHOP COLLECTION
          </a>
        </div>


        <div className="heroShirt">
          <div className="shirtShape">
            <span>ASCEND</span>


            <small>EST. 2026</small>


            <div className="shirtGraphic">
              ◎
            </div>


            <p>BUILT DIFFERENT</p>
          </div>
        </div>
      </section>


      <section className="values">
        <article>
          <span>✝</span>
          <h3>FAITH</h3>
          <p>Rooted in purpose.</p>
        </article>


        <article>
          <span>◎</span>
          <h3>DISCIPLINE</h3>
          <p>Built in the dark.</p>
        </article>


        <article>
          <span>△</span>
          <h3>PURPOSE</h3>
          <p>Elevate every day.</p>
        </article>


        <article>
          <span>↗</span>
          <h3>GROWTH</h3>
          <p>Live on your terms.</p>
        </article>
      </section>


      <section
        className="productsSection"
        id="products"
      >
        <p className="sectionLabel">
          FEATURED
        </p>


        <h2>ASCEND COLLECTION</h2>


        <div className="productsGrid">
          {products.map((product) => (
            <article
              className="productCard"
              key={product.id}
            >
              <Link
                href={`/products/${product.slug}`}
                className="productImage"
              >
                <img
                  src={product.image}
                  alt={product.name}
                />
              </Link>


              <div className="productInfo">
                <h3>{product.name}</h3>


                <p>
                  $
                  {product.price.toFixed(
                    2
                  )}
                </p>


                <Link
                  href={`/products/${product.slug}`}
                >
                  SHOP NOW
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>


      <section
        className="mission"
        id="mission"
      >
        <p className="sectionLabel">
          THE MISSION
        </p>


        <h2>MORE THAN A SHIRT.</h2>


        <p>
          Allen Motion Co. represents
          faith, discipline, purpose, and
          growth. ASCEND was created for
          people who keep moving—even when
          doubt tells them to stop.
        </p>
      </section>


      <section
        className="owner"
        id="owner"
      >
        <p className="sectionLabel">
          ABOUT THE OWNER
        </p>


        <h2>BUILT FROM A REAL STORY.</h2>


        <p>
          Founded by college sprinter and
          creator DK Allen, Allen Motion
          Co. blends athletics, purpose,
          and streetwear into clothing
          designed to mean something.
        </p>
      </section>


      <footer id="contact">
        <div>
          <strong>
            ALLEN MOTION CO.
          </strong>


          <p>
            Built different. Made to
            ascend.
          </p>
        </div>


        <div>
          <a href="mailto:dkiranallen@gmail.com">
            dkiranallen@gmail.com
          </a>


          <p>
            © 2026 Allen Motion Co.
          </p>
        </div>
      </footer>
    </main>
  );
}
