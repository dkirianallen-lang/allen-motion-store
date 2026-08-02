"use client";


import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";


type StoredCartItem = {
  quantity?: number;
};


type NewsletterResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};


const products = [
  {
    id: 1,
    slug: "gray",
    name:
      "ASCEND TRACK GRAPHIC TEE — VINTAGE GRAY",
    price: 39.99,
    image: "/gray-shirt.png",
  },
  {
    id: 2,
    slug: "black",
    name:
      "ASCEND TRACK GRAPHIC TEE — VINTAGE BLACK",
    price: 39.99,
    image: "/black-shirt.png",
  },
  {
    id: 3,
    slug: "cream",
    name:
      "ASCEND TRACK GRAPHIC TEE — CREAM",
    price: 39.99,
    image: "/cream-shirt.png",
  },
];


export default function Home() {
  const [menuOpen, setMenuOpen] =
    useState(false);


  const [cartCount, setCartCount] =
    useState(0);


  const [
    contactMessage,
    setContactMessage,
  ] = useState("");


  const [
    showShopMessage,
    setShowShopMessage,
  ] = useState(false);


  const [
    newsletterEmail,
    setNewsletterEmail,
  ] = useState("");


  const [
    newsletterMessage,
    setNewsletterMessage,
  ] = useState("");


  const [
    newsletterSuccess,
    setNewsletterSuccess,
  ] = useState(false);


  const [
    newsletterLoading,
    setNewsletterLoading,
  ] = useState(false);


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


  function handleShopClick() {
    setShowShopMessage(true);


    window.setTimeout(() => {
      document
        .getElementById("products")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });


      setShowShopMessage(false);
    }, 1500);
  }


  async function handleNewsletterSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    setNewsletterMessage("");
    setNewsletterSuccess(false);


    const form = event.currentTarget;
    const formData = new FormData(form);


    const email = String(
      formData.get("newsletterEmail") || ""
    )
      .trim()
      .toLowerCase();


    const website = String(
      formData.get("website") || ""
    ).trim();


    if (!email) {
      setNewsletterMessage(
        "Please enter your email address."
      );


      return;
    }


    setNewsletterLoading(true);


    try {
      const response = await fetch(
        "/api/newsletter/subscribe",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            website,
          }),
        }
      );


      const responseText =
        await response.text();


      let data: NewsletterResponse = {};


      if (responseText) {
        try {
          data = JSON.parse(
            responseText
          ) as NewsletterResponse;
        } catch {
          data = {
            success: false,
            error:
              "The server returned an unreadable response.",
          };
        }
      }


      if (
        !response.ok ||
        data.success === false
      ) {
        setNewsletterMessage(
          data.error ||
            "We could not save your email. Please try again."
        );


        return;
      }


      setNewsletterSuccess(true);


      setNewsletterMessage(
        data.message ||
          "Welcome to the movement."
      );


      setNewsletterEmail("");
      form.reset();
    } catch (error) {
      console.error(
        "Newsletter form error:",
        error
      );


      setNewsletterMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setNewsletterLoading(false);
    }
  }


  function handleContactSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    const form = event.currentTarget;
    const formData = new FormData(form);


    const name = String(
      formData.get("name") || ""
    ).trim();


    const email = String(
      formData.get("email") || ""
    ).trim();


    const subject = String(
      formData.get("subject") || ""
    ).trim();


    const message = String(
      formData.get("message") || ""
    ).trim();


    if (
      !name ||
      !email ||
      !subject ||
      !message
    ) {
      setContactMessage(
        "Please complete every field."
      );


      return;
    }


    const emailSubject =
      encodeURIComponent(
        `Allen Motion Co. Contact: ${subject}`
      );


    const emailBody =
      encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
      );


    window.location.href =
      `mailto:ascendco25@gmail.com?subject=${emailSubject}&body=${emailBody}`;


    setContactMessage(
      "Your email app should open with the message prepared."
    );
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
            href="#movement"
            onClick={closeMenu}
          >
            Join the Movement
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
        <a href="#products">
          Products
        </a>


        <a href="#mission">
          The Mission
        </a>


        <a href="#owner">
          About Owner
        </a>


        <a href="#movement">
          Join the Movement
        </a>


        <a href="#contact">
          Contact
        </a>


        <Link href="/cart">
          Cart ({cartCount})
        </Link>
      </nav>


      <section className="videoHero">
        <video
          className="heroBackgroundVideo"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source
            src="/ascend-hero.mp4"
            type="video/mp4"
          />
        </video>


        <div className="heroVideoOverlay" />


        <div className="heroVideoContent">
          <p className="heroVideoEyebrow">
            ALLEN MOTION CO. PRESENTS
          </p>


          <h1>ASCEND</h1>


          <h2>
            BUILT FOR THOSE WHO KEEP
            GOING.
          </h2>


          <div className="heroVideoLine" />


          <p className="heroVideoText">
            From doubt to discipline.
            From pressure to purpose.
          </p>


          <button
            type="button"
            className="heroVideoButton"
            onClick={handleShopClick}
          >
            SHOP COLLECTION
          </button>
        </div>


        <div className="heroBottomFade" />
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
          Faith, Discipline, Purpose, and
          Growth. ASCEND was created for
          people who keep moving—even when
          doubt tells them to stop. Unleash
          that dog.
        </p>
      </section>


      <section
        className="owner"
        id="owner"
      >
        <p className="sectionLabel">
          ABOUT THE OWNER
        </p>


        <h2>
          BUILT FROM A REAL STORY.
        </h2>


        <p>
          Founded by college sprinter and
          creator D&apos;Kirian Allen,
          Allen Motion Co. blends
          athletics, purpose, and
          streetwear into clothing
          designed to mean something.
        </p>
      </section>


      <section
        className="newsletterSection"
        id="movement"
      >
        <div className="newsletterContent">
          <p className="sectionLabel">
            STAY CONNECTED
          </p>


          <h2>JOIN THE MOVEMENT</h2>


          <div className="newsletterLine" />


          <p className="newsletterDescription">
            Be the first to know about new
            drops, exclusive releases, and
            behind-the-scenes updates.
          </p>


          <form
            className="newsletterForm"
            onSubmit={
              handleNewsletterSubmit
            }
          >
            <label
              htmlFor="newsletterEmail"
              className="newsletterLabel"
            >
              Email address
            </label>


            <div className="newsletterFormRow">
              <input
                id="newsletterEmail"
                name="newsletterEmail"
                type="email"
                value={newsletterEmail}
                onChange={(event) => {
                  setNewsletterEmail(
                    event.target.value
                  );


                  setNewsletterMessage("");
                  setNewsletterSuccess(
                    false
                  );
                }}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />


              <button
                type="submit"
                disabled={
                  newsletterLoading
                }
              >
                {newsletterLoading
                  ? "JOINING..."
                  : "JOIN"}
              </button>
            </div>


            <div
              className="newsletterHoneypot"
              aria-hidden="true"
            >
              <label htmlFor="website">
                Website
              </label>


              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>


            {newsletterMessage && (
              <p
                className={
                  newsletterSuccess
                    ? "newsletterMessage newsletterMessageSuccess"
                    : "newsletterMessage newsletterMessageError"
                }
                aria-live="polite"
              >
                {newsletterMessage}
              </p>
            )}
          </form>


          <p className="newsletterPrivacy">
            By joining, you agree to receive
            Allen Motion Co. updates. You
            can unsubscribe anytime.
          </p>
        </div>
      </section>


      <section
        className="contactSection"
        id="contact"
      >
        <div className="contactHeading">
          <p className="sectionLabel">
            GET IN TOUCH
          </p>


          <h2>CONTACT</h2>


          <div className="contactLine" />


          <p>
            Questions about an order,
            sizing, shipping, or the
            ASCEND collection? Send a
            message below.
          </p>
        </div>


        <form
          className="contactForm"
          onSubmit={handleContactSubmit}
        >
          <label htmlFor="contactName">
            Name
          </label>


          <input
            id="contactName"
            name="name"
            type="text"
            autoComplete="name"
            required
          />


          <label htmlFor="contactEmail">
            Email
          </label>


          <input
            id="contactEmail"
            name="email"
            type="email"
            autoComplete="email"
            required
          />


          <label htmlFor="contactSubject">
            Subject
          </label>


          <input
            id="contactSubject"
            name="subject"
            type="text"
            required
          />


          <label htmlFor="contactMessage">
            Message
          </label>


          <textarea
            id="contactMessage"
            name="message"
            rows={8}
            required
          />


          <button type="submit">
            SEND MESSAGE
          </button>


          {contactMessage && (
            <p
              className="contactFormMessage"
              aria-live="polite"
            >
              {contactMessage}
            </p>
          )}
        </form>
      </section>


      <footer className="siteFooter">
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
          <a href="mailto:ascendco25@gmail.com">
            ascendco25@gmail.com
          </a>


          <p>
            © 2026 Allen Motion Co.
          </p>
        </div>
      </footer>


      {showShopMessage && (
        <div
          className="shopMotivationOverlay"
          role="status"
          aria-live="polite"
        >
          <div className="shopMotivationCard">
            <p>
              WEAR THE MINDSET.
            </p>


            <strong>
              LIVE THE MESSAGE.
            </strong>
          </div>
        </div>
      )}
    </main>
  );
}
