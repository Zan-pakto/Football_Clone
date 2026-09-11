import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/auth-service";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("auth_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    const user = await authService.getCurrentUser(token);
    return NextResponse.json({
      success: true,
      isLoggedIn: Boolean(user),
      user: user || null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    const userAgent = request.headers.get("user-agent") || "Browser";
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";

    if (action === "register") {
      if (!email || !password) {
        return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
      }
      const { user, token } = await authService.register({ email, password, name });
      const response = NextResponse.json({ success: true, user, message: "Registered successfully" });
      response.cookies.set("auth_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 604800 });
      return response;
    }

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
      }
      const { user, token } = await authService.login({
        email,
        password,
        userAgent,
        ipAddress,
        deviceName: userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Computer",
      });
      const response = NextResponse.json({ success: true, user, message: "Logged in successfully" });
      response.cookies.set("auth_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 604800 });
      return response;
    }

    if (action === "logout") {
      const response = NextResponse.json({ success: true, message: "Logged out" });
      response.cookies.delete("auth_token");
      return response;
    }

    // Authenticated actions
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("auth_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;
    const currentUser = await authService.getCurrentUser(token);

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (action === "update_profile") {
      const updatedUser = await authService.updateProfile(currentUser.id, { name });
      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: "Profile updated successfully",
      });
    }

    if (action === "change_password") {
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ success: false, error: "Current and new passwords are required" }, { status: 400 });
      }
      await authService.changePassword(currentUser.id, currentPassword, newPassword);
      return NextResponse.json({
        success: true,
        message: "Password changed successfully",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Authentication error" }, { status: 400 });
  }
}
