import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deleteUser, setUserFlags, setUserType } from "./actions";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations({ locale, namespace: "admin.users" });

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }
  if (session.user.userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  const users = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      userType: true,
      emailVerified: true,
      isActive: true,
      isBlacklisted: true,
      createdAt: true,
    },
    take: 200,
  });

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
            <p className="mt-2 text-white/60">
              {t("subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/centers"
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
            >
{t("validateCenters")}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/10"
            >
{t("dashboard")}
            </Link>
          </div>
        </div>

        <div className="mt-10 space-y-4">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-white">
                    {u.displayName || u.email}
                  </div>
                  <div className="mt-1 text-sm text-white/60">{u.email}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                      {u.userType}
                    </span>
                    <span className={`rounded-full border px-3 py-1 ${u.isActive ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : "border-red-500/20 bg-red-500/10 text-red-200"}`}>
                      {u.isActive ? "Actif" : "Désactivé"}
                    </span>
                    <span className={`rounded-full border px-3 py-1 ${u.isBlacklisted ? "border-amber-500/20 bg-amber-500/10 text-amber-200" : "border-white/10 bg-white/5 text-white/70"}`}>
                      {u.isBlacklisted ? "Blacklist" : "OK"}
                    </span>
                    <span className={`rounded-full border px-3 py-1 ${u.emailVerified ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-200" : "border-white/10 bg-white/5 text-white/70"}`}>
                      {u.emailVerified ? "Email vérifié" : "Email non vérifié"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Role */}
                  <form action={setUserType} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <select
                      name="userType"
                      defaultValue={u.userType}
                      className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white"
                    >
                      <option value="DIVER">{t("userTypes.diver")}</option>
                      <option value="SELLER">{t("userTypes.seller")}</option>
                      <option value="CENTER_OWNER">{t("userTypes.center")}</option>
                      <option value="ADMIN">{t("userTypes.admin")}</option>
                    </select>
                    <button
                      type="submit"
                      className="h-10 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
                    >
                      Appliquer
                    </button>
                  </form>

                  {/* Flags */}
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={setUserFlags}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="isActive" value={u.isActive ? "false" : "true"} />
                      <button
                        type="submit"
                        className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                      >
                        {u.isActive ? "Désactiver" : "Activer"}
                      </button>
                    </form>

                    <form action={setUserFlags}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="isBlacklisted" value={u.isBlacklisted ? "false" : "true"} />
                      <button
                        type="submit"
                        className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                      >
                        {u.isBlacklisted ? "Retirer blacklist" : "Blacklist"}
                      </button>
                    </form>

                    <form action={deleteUser}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <button
                        type="submit"
                        className="h-10 rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {users.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/70 backdrop-blur-xl">
              Aucun utilisateur.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

