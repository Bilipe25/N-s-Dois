import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Gift, Users, CheckCircle2, ShoppingBag } from "lucide-react";
import type { Gift as GiftType, Guest } from "./types";

interface StatsDashboardProps {
    gifts: GiftType[];
    guests: Guest[];
}

export function StatsDashboard({ gifts, guests }: StatsDashboardProps) {
    const totalGifts = gifts.length;
    const boughtGifts = gifts.filter(g => g.status === 'comprado').length;
    const progressGifts = totalGifts > 0 ? (boughtGifts / totalGifts) * 100 : 0;

    const totalGuests = guests.length;
    const confirmedGuests = guests.filter(g => g.confirmed).length;
    const progressGuests = totalGuests > 0 ? (confirmedGuests / totalGuests) * 100 : 0;

    return (
        <div className="grid grid-cols-2 gap-4">
            <Card className="col-span-2 sm:col-span-1 border-rose-100 bg-gradient-to-br from-white to-rose-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Gift className="h-4 w-4 text-rose-500" /> Presentes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-2xl font-bold text-rose-950">{boughtGifts}/{totalGifts}</div>
                        <span className="text-xs text-rose-600 font-medium">{Math.round(progressGifts)}%</span>
                    </div>
                    <Progress value={progressGifts} className="h-2 bg-rose-100" indicatorClassName="bg-rose-500" />
                </CardContent>
            </Card>

            <Card className="col-span-2 sm:col-span-1 border-blue-100 bg-gradient-to-br from-white to-blue-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" /> Convidados
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-2xl font-bold text-blue-950">{confirmedGuests}/{totalGuests}</div>
                        <span className="text-xs text-blue-600 font-medium">{Math.round(progressGuests)}%</span>
                    </div>
                    <Progress value={progressGuests} className="h-2 bg-blue-100" indicatorClassName="bg-blue-500" />
                </CardContent>
            </Card>
        </div>
    );
}
