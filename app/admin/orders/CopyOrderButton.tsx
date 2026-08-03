"use client";


import { useState } from "react";


type OrderItem = {
  slug?: string;
  size?: string;
  quantity?: number;
};


type CopyOrderButtonProps = {
  orderId: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  countryCode: string | null;
  items: OrderItem[] | null;
};


const productNames: Record<
  string,
  string
> = {
  black:
    "ASCEND Track Graphic Tee — Vintage Black",


  gray:
    "ASCEND Track Graphic Tee — Vintage Gray",


  cream:
    "ASCEND Track Graphic Tee — Cream",
};


export default function CopyOrderButton({
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  addressLine1,
  addressLine2,
  city,
  state,
  postalCode,
  countryCode,
  items,
}: CopyOrderButtonProps) {
  const [copied, setCopied] =
    useState(false);


  async function copyOrder() {
    const itemLines =
      items?.map((item) => {
        const productName =
          item.slug
            ? productNames[item.slug] ||
              item.slug
            : "Unknown product";


        return [
          `Product: ${productName}`,
          `Size: ${
            item.size || "Unknown"
          }`,
          `Quantity: ${
            item.quantity || 1
          }`,
        ].join("\n");
      }) || ["No items saved"];


    const cityStateZip = [
      city,
      state,
      postalCode,
    ]
      .filter(Boolean)
      .join(", ");


    const orderText = [
      `ALLEN MOTION CO. — ORDER #${orderId}`,
      "",
      `Customer: ${
        customerName || "Customer"
      }`,
      `Email: ${
        customerEmail ||
        "No email saved"
      }`,
      `Phone: ${
        customerPhone ||
        "No phone number saved"
      }`,
      "",
      "ORDER:",
      itemLines.join("\n\n"),
      "",
      "SHIP TO:",
      customerName || "Customer",
      addressLine1 ||
        "No address saved",
      addressLine2 || "",
      cityStateZip,
      countryCode || "",
      "",
      `Delivery phone: ${
        customerPhone ||
        "No phone number saved"
      }`,
    ]
      .filter((line) => line !== "")
      .join("\n");


    try {
      await navigator.clipboard.writeText(
        orderText
      );


      setCopied(true);


      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Order copy error:",
        error
      );


      alert(
        "The order could not be copied. Please try again."
      );
    }
  }


  return (
    <button
      type="button"
      onClick={copyOrder}
      style={{
        marginTop: "14px",
        padding: "11px 16px",
        background: copied
          ? "#8fcf9a"
          : "transparent",
        color: copied
          ? "#111"
          : "#f5eadf",
        border: copied
          ? "1px solid #8fcf9a"
          : "1px solid #c79a55",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {copied
        ? "COPIED ✓"
        : "COPY FOR JEAN"}
    </button>
  );
}
