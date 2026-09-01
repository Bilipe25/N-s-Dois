import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Check, UserRoundCheck, UserPlus } from "lucide-react";
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Guest } from "./types";
import { confirmedCounts } from "@/lib/guest-rsvp";

interface GuestStatsProps {
    guests: Guest[];
}

export function GuestStats({ guests }: GuestStatsProps) {
    const newFromSite = guests.filter((guest) => guest.source === "public_rsvp");
    const confirmedGuests = guests.filter(g => g.rsvp_status === 'confirmado');
    const confirmedAdults = confirmedGuests.reduce((acc, curr) => acc + confirmedCounts(curr).adults, 0);
    const confirmedChildren = confirmedGuests.reduce((acc, curr) => acc + confirmedCounts(curr).children, 0);
    const confirmedTotal = confirmedAdults + confirmedChildren;

    const groups = Array.from(new Set(guests.map(g => g.group_name))).filter(Boolean) as string[];
    const groupData = groups.map(g => ({
        name: g,
        value: guests.filter(guest => guest.group_name === g).length
    }));

    return (
        <div className="space-y-4">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="bg-white border-stone-200 shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center mb-2 text-stone-600">
                            <Users className="h-4 w-4" />
                        </div>
                        <div className="text-2xl font-serif font-bold text-stone-800">{guests.length}</div>
                        <div className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">Convites cadastrados</div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-green-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center mb-2 text-green-600">
                            <Check className="h-4 w-4" />
                        </div>
                        <div className="text-2xl font-serif font-bold text-green-700">{confirmedGuests.length}</div>
                        <div className="text-[10px] text-green-600 uppercase tracking-wider font-medium">Convites confirmados</div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-emerald-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center mb-2 text-emerald-700">
                            <UserRoundCheck className="h-4 w-4" />
                        </div>
                        <div className="text-2xl font-serif font-bold text-emerald-700">{confirmedTotal}</div>
                        <div className="text-[10px] text-emerald-700 uppercase tracking-wider font-medium">Pessoas confirmadas</div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-violet-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="h-8 w-8 rounded-full bg-violet-50 flex items-center justify-center mb-2 text-violet-700">
                            <UserPlus className="h-4 w-4" />
                        </div>
                        <div className="text-2xl font-serif font-bold text-violet-700">{newFromSite.length}</div>
                        <div className="text-[10px] text-violet-700 uppercase tracking-wider font-medium">Novos pelo site</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-sm border-stone-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">Distribuição por Grupo</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={groupData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} interval={0} angle={-45} textAnchor="end" height={60} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f3f4f6' }}
                                />
                                <Bar dataKey="value" fill="#be123c" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-stone-200">
                    <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-stone-500 uppercase">Confirmados</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-stone-800">{confirmedAdults}</span>
                                <span className="text-[10px] text-stone-400 uppercase">Adultos</span>
                            </div>
                            <div className="w-px h-4 bg-stone-200" />
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-stone-800">{confirmedChildren}</span>
                                <span className="text-[10px] text-stone-400 uppercase">Crianças</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
