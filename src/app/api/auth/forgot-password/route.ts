import { dbConnect } from "@/lib/db";
import { sendEmail } from "@/lib/sendEmail";
import User from "@/models/User";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    // Always return success to avoid account enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "A password reset link has been sent.",
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Save token + expiry (15 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const emailHtml = `
  <div style="background-color:#ffffff;padding:40px;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial;">
    <div style="
      max-width:600px;
      margin-left:auto;
      margin-right:auto;
      background-color:#ffffff;
      border-radius:12px;
      padding:32px;
      border:1px solid #e2e8f0;
      box-shadow:0 4px 12px rgba(0,0,0,0.06);
    ">
      
      <h2 style="
        font-size:24px;
        font-weight:700;
        color:#1e293b;
        text-align:center;
        margin:0;
        margin-bottom:16px;
      ">
        Reset Your Password
      </h2>

      <p style="
        color:#475569;
        font-size:15px;
        line-height:1.6;
        margin-bottom:24px;
        text-align:center;
      ">
        We received a request to reset your password.  
        Click the button below to continue.
      </p>

      <div style="text-align:center;margin-top:30px;margin-bottom:30px;">
        <a href="${resetUrl}" style="
          background-color:#3C50E0;
          color:#ffffff;
          padding:12px 28px;
          font-size:16px;
          font-weight:600;
          border-radius:8px;
          text-decoration:none;
          display:inline-block;
          box-shadow:0 3px 8px rgba(60,80,224,0.35);
        ">
          Reset Password
        </a>
      </div>

      <p style="
        color:#64748b;
        font-size:14px;
        margin-bottom:10px;
      ">
        This password reset link will expire in <strong>15 minutes</strong>.
      </p>

      <p style="
        color:#94a3b8;
        font-size:12px;
        margin-top:20px;
        border-top:1px solid #e2e8f0;
        padding-top:16px;
        text-align:center;
      ">
        If you didn’t request this email, you can safely ignore it.
      </p>

    </div>
  </div>
`;

    await sendEmail({
      to: email,
      subject: "Reset Your Password",
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message:
        "If the email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
