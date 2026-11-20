# راهنمای ساخت، اجرا و انتشار نسخه iOS گمپتو در TestFlight

این راهنما مراحل کامل آماده‌سازی، اجرا روی آیفون، انتشار در **TestFlight (داخلی و External)** و فعال‌سازی قابلیت‌های پیشرفته (Push سروری، ویجت/Dynamic Island و فاز بعدی اپل واچ) را پوشش می‌دهد.

---

## ۱. جریان کار روزمره (هم‌زمان با نسخه وب)

نسخه وب (PWA) و نسخه iOS از یک کدبیس مشترک استفاده می‌کنند. هر زمان تغییری در کد React/TS دادید:

```bash
npm run ios:sync   # بیلد نسخه وب + همگام‌سازی خودکار با پروژه Xcode
npm run ios:open   # باز کردن پروژه در Xcode
```

نسخه وب همچنان مثل قبل با `npm run build` بدون هیچ تغییری روی دامنه شما دیپلوی می‌شود.

---

## ۲. تنظیمات اولیه در Xcode (یک‌بار برای همیشه)

1. دستور `npm run ios:open` را بزنید تا `ios/App/App.xcodeproj` در Xcode باز شود.
2. در ستون چپ روی پروژه **App** کلیک کنید، تارگت **App** را انتخاب کنید و وارد تب **Signing & Capabilities** شوید:
   - گزینه **Automatically manage signing** را تیک بزنید.
   - در بخش **Team** اکانت Apple Developer خود را انتخاب کنید.
   - **Bundle Identifier** روی `com.gampetoo.app` تنظیم شده است (اگر قبلاً شناسه دیگری در App Store Connect ساخته‌اید، همان را هم اینجا و هم در `capacitor.config.ts` قرار دهید).
3. از دکمه **`+ Capability`** در همین تب، قابلیت **Push Notifications** را اضافه کنید (برای فعال شدن APNs روی دستگاه واقعی).

---

## ۳. نکته حیاتی درباره Supabase Edge Functions (CORS)

اپ iOS از مبدا `capacitor://localhost` به سرور وصل می‌شود. این مبدا به فایل‌های زیر اضافه شده است:
- `supabase/functions/parse-meal/index.ts`
- `supabase/functions/delete-account/index.ts`

حتماً این دو Edge Function را یک‌بار در **Supabase Dashboard → Edge Functions** دوباره دیپلوی کنید تا «افزودن غذا با هوش مصنوعی» و «حذف حساب» در اپ iOS بدون خطای CORS کار کنند.

---

## ۴. انتشار روی TestFlight (خودتان + کاربران External)

### گام ۱: ساخت اپ در App Store Connect
1. وارد [App Store Connect](https://appstoreconnect.apple.com) شوید → **Apps** → **`+`** → **New App**.
2. پلتفرم **iOS**، نام **Gampetoo**، زبان پیش‌فرض **Persian** (یا English)، و همان **Bundle ID** (`com.gampetoo.app`) را انتخاب کنید.

### گام ۲: Archive و آپلود از Xcode
1. در نوار بالای Xcode مقصد بیلد را روی **Any iOS Device (arm64)** بگذارید.
2. از منوی بالا: **Product → Archive**.
3. پس از پایان Archive پنجره **Organizer** باز می‌شود → **Distribute App** → **App Store Connect** → **Upload**.
4. به‌خاطر تنظیم `ITSAppUsesNonExemptEncryption = false` در `Info.plist`، دیگر هر بار سؤال Export Compliance پرسیده نمی‌شود.

### گام ۳: تست داخلی (Internal) — فوری و بدون بررسی اپل
- در App Store Connect → تب **TestFlight** → بخش **Internal Testing**:
  - یک گروه بسازید، ایمیل Apple ID خودتان را اضافه کنید و اپ **TestFlight** را روی آیفون نصب کنید.
  - معمولاً ۵ تا ۱۵ دقیقه پس از آپلود، بیلد برای نصب آماده است.

### گام ۴: تست خارجی (External) — ارسال لینک عمومی یا دعوت ایمیلی
- در تب **TestFlight** → بخش **External Testing** یک گروه بسازید (مثلاً `Beta Testers`) و بیلد را به آن اضافه کنید.
- **نکات کلیدی برای عبور سریع از Beta App Review اپل**:
  1. در **Test Information → Sign-In Information** یک نام کاربری و رمز تستی (مثلاً `appletest` / `123456`) به داور اپل بدهید تا بتواند وارد اپ شود.
  2. در **What to Test** به زبان انگلیسی کوتاه بنویسید که این یک اپ ردیابی تمرین و تغذیه است که از اعلان‌های محلی زمان استراحت/تمرین/آب و بازخورد لمسی بومی iOS پشتیبانی می‌کند.
  3. المان‌های مخصوص وب/PWA (مثل پیغام `Add to Home Screen` و آپدیتر PWA) به‌صورت خودکار در اپ iOS مخفی شده‌اند تا با قانون Guideline 4.2 تداخل نداشته باشند.
  4. پس از تأیید اولین بیلد (معمولاً ۲۴ تا ۴۸ ساعت)، می‌توانید **Public Link** را فعال کنید و لینک TestFlight را برای تسترها بفرستید.

---

## ۵. فعال‌سازی پوش نوتیفیکیشن سروری (APNs از طریق Supabase)

1. فایل `supabase/push_notifications.sql` را یک‌بار در **Supabase SQL Editor** اجرا کنید تا جدول `device_push_tokens` ساخته شود.
2. در [Apple Developer → Keys](https://developer.apple.com/account/resources/authkeys/list) یک کلید جدید با تیک **Apple Push Notifications service (APNs)** بسازید و فایل `.p8` را دانلود کنید (Key ID و Team ID شما یعنی `YZ37YD3BVG` را یادداشت کنید).
3. فایل `supabase/functions/send-push/index.ts` را به عنوان Edge Function با نام `send-push` در Supabase دیپلوی کنید و این Secretها را ست کنید:
   - `APNS_TEAM_ID` (`YZ37YD3BVG`)
   - `APNS_KEY_ID`
   - `APNS_PRIVATE_KEY` (محتوای فایل `.p8`)
   - `APNS_BUNDLE_ID` (`com.gampetoo.app`)
   - `APNS_ENVIRONMENT` (`production` برای TestFlight)
   - `PUSH_ADMIN_SECRET` (یک کلید امن دلخواه برای ارسال از سرور/کرون)
4. در اپ iOS وارد **تنظیمات** شوید، **اعلان‌های سرور (Push)** را روشن و ذخیره کنید، و روی دکمه **تست پوش** بزنید تا یک پوش واقعی APNs روی آیفون خودتان دریافت کنید.

---

## ۶. ویجت صفحه اصلی و Dynamic Island (فعال‌شده در پروژه Xcode)

تارگت **`GampetooWidgets`** (`com.gampetoo.app.widgets`) همراه با App Group مشترک (`group.com.gampetoo.app`) و فایل مشترک `GampetooRestTimerAttributes.swift` به‌طور کامل داخل `ios/App/App.xcodeproj` اضافه و Embed شده است:
- **ویجت صفحه اصلی** (سایز کوچک و متوسط): نمایش تمرین امروز، کالری، آب و پروتئین
- **Dynamic Island و Lock Screen**: شمارش معکوس زنده تایمر استراحت پس از تأیید هر ست

> نکته Signing در Xcode: پس از اولین بار باز کردن پروژه، در Xcode مطمئن شوید هر دو تارگت `App` و `GampetooWidgets` بدون خطا پروفایل خودکار گرفته‌اند (Xcode به‌صورت خودکار App Group `group.com.gampetoo.app` را روی اکانت Apple Developer شما ثبت می‌کند).

---

## ۷. مدیریت خودکار نسخه و Build Number

- هنگام انتشار نسخه جدید وب و iOS با هم: دستور `npm run release` به‌صورت خودکار `MARKETING_VERSION` و `CURRENT_PROJECT_VERSION` را برای هر دو تارگت `App` و `GampetooWidgets` آپدیت می‌کند.
- هنگام آپلود بیلد جدید فقط برای TestFlight (بدون تغییر نسخه وب): دستور `npm run ios:bump` شماره بیلد هر دو تارگت را با هم یکی بالا می‌برد.

---

## ۷. نقشه راه فاز ۲ (اپل واچ)

ساختار پروژه از همین حالا برای فاز ۲ آماده است:
- **اپ مستقل watchOS با SwiftUI**: در همین پروژه Xcode یک تارگت `Watch App` اضافه می‌شود و با `WatchConnectivity` + همین App Group، تمرین روز، ثبت ست‌ها، تایمر استراحت و ثبت آب را مستقیماً از روی مچ همگام‌سازی می‌کند.
- **HealthKit (اختیاری)**: خواندن قدم‌ها، کالری فعال و تمرین‌های اپل واچ و ثبت تمرین/آب گمپتو در Apple Health.
