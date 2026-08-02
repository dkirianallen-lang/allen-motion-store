import {
  NextRequest,
  NextResponse,
} from "next/server";


const resendApiKey =
  process.env.RESEND_API_KEY;


function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}


export async function POST(
  request: NextRequest
) {
  try {
    if (!resendApiKey) {
      console.error(
        "RESEND_API_KEY is missing."
      );


      return NextResponse.json(
        {
          success: false,
          error:
            "Newsletter service is not configured.",
        },
        { status: 500 }
      );
    }


    const body = await request.json();


    const email = String(
      body.email || ""
    )
      .trim()
      .toLowerCase();


    const website = String(
      body.website || ""
    ).trim();


    // Hidden spam field
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


    const resendResponse = await fetch(
      "https://api.resend.com/contacts",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${resendApiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          email,
          unsubscribed: false,
        }),
        cache: "no-store",
      }
    );


    const responseText =
      await resendResponse.text();


    let resendData: {
      id?: string;
      message?: string;
      error?: string;
      name?: string;
    } = {};


    if (responseText) {
      try {
        resendData =
          JSON.parse(responseText);
      } catch {
        console.error(
          "Unreadable Resend response:",
          responseText
        );


        return NextResponse.json(
          {
            success: false,
            error:
              "The email service returned an unreadable response.",
          },
          { status: 502 }
        );
      }
    }


    if (!resendResponse.ok) {
      const errorMessage = String(
        resendData.message ||
          resendData.error ||
          ""
      ).toLowerCase();


      if (
        errorMessage.includes("already") ||
        errorMessage.includes("exists") ||
        errorMessage.includes("duplicate")
      ) {
        return NextResponse.json({
          success: true,
          message:
            "You’re already part of the movement.",
        });
      }


      console.error(
        "Resend contact error:",
        resendResponse.status,
        resendData
      );


      return NextResponse.json(
        {
          success: false,
          error:
            resendData.message ||
            resendData.error ||
            "We could not save your email. Please try again.",
        },
        {
          status:
            resendResponse.status,
        }
      );
    }


    return NextResponse.json({
      success: true,
      message:
        "Welcome to the movement.",
      contactId: resendData.id,
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
