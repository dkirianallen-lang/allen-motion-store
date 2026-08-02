import {
  NextRequest,
  NextResponse,
} from "next/server";
import { Resend } from "resend";


const resendApiKey =
  process.env.RESEND_API_KEY;


if (!resendApiKey) {
  throw new Error(
    "Missing RESEND_API_KEY environment variable."
  );
}


const resend = new Resend(
  resendApiKey
);


function isValidEmail(
  email: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}


export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();


    const email = String(
      body.email || ""
    )
      .trim()
      .toLowerCase();


    const website = String(
      body.website || ""
    ).trim();


    /*
     * Hidden spam-protection field.
     * Real customers will leave this empty.
     */
    if (website) {
      return NextResponse.json({
        success: true,
        message:
          "Welcome to the movement.",
      });
    }


    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter your email address.",
        },
        { status: 400 }
      );
    }


    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }


    const {
      data,
      error,
    } = await resend.contacts.create({
      email,
      unsubscribed: false,
    });


    if (error) {
      const errorMessage =
        String(error.message || "")
          .toLowerCase();


      /*
       * If the email already joined,
       * treat it as a successful sign-up.
       */
      if (
        errorMessage.includes(
          "already"
        ) ||
        errorMessage.includes(
          "exists"
        ) ||
        errorMessage.includes(
          "duplicate"
        )
      ) {
        return NextResponse.json({
          success: true,
          message:
            "You’re already part of the movement.",
        });
      }


      console.error(
        "Resend contact error:",
        error
      );


      return NextResponse.json(
        {
          success: false,
          error:
            "We could not save your email. Please try again.",
        },
        { status: 500 }
      );
    }


    console.log(
      "Newsletter contact created:",
      data?.id
    );


    return NextResponse.json({
      success: true,
      message:
        "Welcome to the movement.",
    });
  } catch (error) {
    console.error(
      "Newsletter signup error:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        error:
          "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
