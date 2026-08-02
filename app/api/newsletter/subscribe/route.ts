import {
  NextRequest,
  NextResponse,
} from "next/server";


const resendApiKey =
  process.env.RESEND_API_KEY;


const resendContactsUrl =
  "https://api.resend.com/contacts";


const resendEmailsUrl =
  "https://api.resend.com/emails";


type ResendResponse = {
  id?: string;
  message?: string;
  error?: string;
  name?: string;
};


function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}


async function readResendResponse(
  response: Response
): Promise<ResendResponse> {
  const responseText =
    await response.text();


  if (!responseText) {
    return {};
  }


  try {
    return JSON.parse(
      responseText
    ) as ResendResponse;
  } catch {
    console.error(
      "Unreadable Resend response:",
      responseText
    );


    return {
      error:
        "The email service returned an unreadable response.",
    };
  }
}


function getResendErrorMessage(
  data: ResendResponse,
  fallback: string
) {
  return (
    data.message ||
    data.error ||
    fallback
  );
}


function isDuplicateContact(
  data: ResendResponse
) {
  const message = String(
    data.message ||
      data.error ||
      data.name ||
      ""
  ).toLowerCase();


  return (
    message.includes("already") ||
    message.includes("exists") ||
    message.includes("duplicate")
  );
}


function buildWelcomeEmail() {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />


        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />


        <title>
          Welcome to the Movement
        </title>
      </head>


      <body
        style="
          margin:0;
          padding:0;
          background:#050505;
          color:#eee3d2;
          font-family:Arial,Helvetica,sans-serif;
        "
      >
        <div
          style="
            width:100%;
            background:#050505;
            padding:40px 16px;
          "
        >
          <div
            style="
              max-width:650px;
              margin:0 auto;
              border:1px solid #6b4d25;
              background:#0d0c0a;
            "
          >
            <div
              style="
                padding:42px 30px;
                text-align:center;
                background:
                  linear-gradient(
                    145deg,
                    #17140f,
                    #070707
                  );
              "
            >
              <p
                style="
                  margin:0 0 18px;
                  color:#c9953f;
                  font-size:13px;
                  font-weight:700;
                  letter-spacing:4px;
                "
              >
                ALLEN MOTION CO.
              </p>


              <h1
                style="
                  margin:0;
                  color:#eee3d2;
                  font-family:Georgia,serif;
                  font-size:46px;
                  font-weight:400;
                  line-height:1.1;
                  letter-spacing:3px;
                "
              >
                WELCOME TO
                <br />
                THE MOVEMENT.
              </h1>


              <div
                style="
                  width:65px;
                  height:3px;
                  margin:26px auto;
                  background:#c9953f;
                "
              ></div>


              <p
                style="
                  margin:0;
                  color:#a59b8d;
                  font-family:Georgia,serif;
                  font-size:18px;
                  line-height:1.7;
                "
              >
                You’re officially part of
                Allen Motion Co.
              </p>
            </div>


            <div
              style="
                padding:36px 30px;
                color:#cfc4b8;
                font-size:16px;
                line-height:1.8;
              "
            >
              <p style="margin-top:0;">
                Thank you for joining the
                movement.
              </p>


              <p>
                As a subscriber, you’ll be
                among the first to know about:
              </p>


              <div
                style="
                  margin:25px 0;
                  padding:22px;
                  border-left:3px solid #c9953f;
                  background:#15130f;
                "
              >
                <p style="margin:0 0 10px;">
                  New ASCEND drops
                </p>


                <p style="margin:0 0 10px;">
                  Exclusive releases
                </p>


                <p style="margin:0 0 10px;">
                  Restocks and announcements
                </p>


                <p style="margin:0;">
                  Behind-the-scenes updates
                </p>
              </div>


              <p>
                Allen Motion Co. was built on
                Faith, Discipline, Purpose,
                and Growth.
              </p>


              <p
                style="
                  margin:28px 0 0;
                  color:#e2bf7d;
                  font-family:Georgia,serif;
                  font-size:20px;
                  line-height:1.7;
                "
              >
                Stay disciplined.
                <br />


                Keep moving.
                <br />


                Never stop ascending.
              </p>


              <p
                style="
                  margin:32px 0 0;
                  color:#eee3d2;
                "
              >
                — D’Kirian Allen
                <br />


                <span
                  style="
                    color:#a59b8d;
                    font-size:14px;
                  "
                >
                  Founder, Allen Motion Co.
                </span>
              </p>
            </div>


            <div
              style="
                padding:24px 30px;
                border-top:1px solid #49351d;
                color:#756c61;
                background:#080808;
                text-align:center;
                font-size:12px;
                line-height:1.6;
              "
            >
              You received this email because
              you joined the Allen Motion Co.
              email list at allenmotion.vip.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
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


    /*
     * Hidden spam field.
     * Real visitors will leave this empty.
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


    /*
     * Step 1:
     * Save the subscriber as a Resend contact.
     */
    const contactResponse = await fetch(
      resendContactsUrl,
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


    const contactData =
      await readResendResponse(
        contactResponse
      );


    /*
     * Do not send another welcome email if the
     * person was already subscribed.
     */
    if (!contactResponse.ok) {
      if (
        isDuplicateContact(contactData)
      ) {
        return NextResponse.json({
          success: true,
          message:
            "You’re already part of the movement.",
        });
      }


      console.error(
        "Resend contact error:",
        contactResponse.status,
        contactData
      );


      return NextResponse.json(
        {
          success: false,
          error: getResendErrorMessage(
            contactData,
            "We could not save your email. Please try again."
          ),
        },
        {
          status:
            contactResponse.status || 500,
        }
      );
    }


    /*
     * Step 2:
     * Send the new subscriber their welcome
     * email immediately.
     */
    const welcomeEmailResponse =
      await fetch(resendEmailsUrl, {
        method: "POST",


        headers: {
          Authorization:
            `Bearer ${resendApiKey}`,


          "Content-Type":
            "application/json",
        },


        body: JSON.stringify({
          from:
            "Allen Motion Co. <orders@allenmotion.vip>",


          to: [email],


          reply_to:
            "ascendco25@gmail.com",


          subject:
            "Welcome to the Movement.",


          html: buildWelcomeEmail(),
        }),


        cache: "no-store",
      });


    const welcomeEmailData =
      await readResendResponse(
        welcomeEmailResponse
      );


    if (!welcomeEmailResponse.ok) {
      console.error(
        "Welcome email error:",
        welcomeEmailResponse.status,
        welcomeEmailData
      );


      /*
       * The subscriber is still safely stored,
       * even if the welcome email has a temporary
       * delivery problem.
       */
      return NextResponse.json({
        success: true,
        message:
          "Welcome to the movement. Your email has been saved.",
        contactId: contactData.id,
        welcomeEmailSent: false,
      });
    }


    console.log(
      "Newsletter subscriber saved:",
      contactData.id
    );


    console.log(
      "Welcome email sent:",
      welcomeEmailData.id
    );


    return NextResponse.json({
      success: true,
      message:
        "Welcome to the movement. Check your inbox!",
      contactId: contactData.id,
      welcomeEmailId:
        welcomeEmailData.id,
      welcomeEmailSent: true,
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
