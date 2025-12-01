import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Check, X, HelpCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Guest } from "./types";

interface GuestStatsProps {
    guests: Guest[];
}

export function GuestStats({ guests }: GuestStatsProps) {
    const totalAdults = guests.reduce((acc, curr) => acc + (curr.adults_count || 0), 0);
    const totalChildren = guests.reduce((acc, curr) => acc + (curr.children_count || 0), 0);
    const totalGuests = totalAdults + totalChildren;

    const confirmedGuests = guests.filter(g => g.rsvp_status === 'confirmado');
    const confirmedAdults = confirmedGuests.reduce((acc, curr) => acc + (curr.adults_count || 0), 0);
    const confirmedChildren = confirmedGuests.reduce((acc, curr) => acc + (curr.children_count || 0), 0);
    const confirmedTotal = confirmedAdults + confirmedChildren;

    const pendingCount = guests.filter(g => g.rsvp_status === 'pendente').length;
    const declinedCount = guests.filter(g => g.rsvp_status === 'recusado').length;

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
                        <div className="text-2xl font-serif font-bold text-stone-800">{totalGuests}</div>
                        <div className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">Total Convidados</div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-green-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center mb-2 text-green-600">
                            <Check className="h-4 w-4" />
                        </div>
                        <div className="text-2xl font-serif font-bold text-green-700">{confirmedTotal}</div>
                        <div className="text-[10px] text-green-600 uppercase tracking-wider font-medium">Confirmados</div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-yellow-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="h-8 w-8 rounded-full bg-yellow-50 flex items-center justify-center mb-2 text-yellow-600">
                            <HelpCircle className="h-4 w-4" />
                        </div>
                        <div className="text-2xl font-serif font-bold text-yellow-700">{pendingCount}</div>
                        <div className="text-[10px] text-yellow-600 uppercase tracking-wider font-medium">Pendentes</div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-red-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center mb-2 text-red-600">
                            <X className="h-4 w-4" />
                        </div>
                        <div className="text-2xl font-serif font-bold text-red-700">{declinedCount}</div>
                        <div className="text-[10px] text-red-600 uppercase tracking-wider font-medium">Recusados</div>
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
                    <CardContent className="p-4 h-[200px] flex flex-col justify-center">
                        <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-4 text-center">Confirmados</h3>
                        <div className="flex justify-center gap-8">
                            <div className="flex flex-col items-center">
                                <span className="text-4xl font-serif font-bold text-stone-800">{confirmedAdults}</span>
                                <span className="text-[10px] text-stone-400 uppercase mt-1">Adultos</span>
                            </div>
                            <div className="w-px h-12 bg-stone-100" />
                            <div className="flex flex-col items-center">
                                <span className="text-4xl font-serif font-bold text-stone-800">{confirmedChildren}</span>
                                <span className="text-[10px] text-stone-400 uppercase mt-1">Crianças</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
