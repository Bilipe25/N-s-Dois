import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "../ui/progress";
import { Gift, Users } from "lucide-react";
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
        <div className="grid grid-cols-2 gap-3">
            <Card className="shadow-sm border-stone-200">
                <CardContent className="p-3 flex flex-col justify-center h-full gap-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Gift className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium uppercase tracking-wider">Presentes</span>
                        </div>
                        <span className="text-xs font-bold text-stone-700">{Math.round(progressGifts)}%</span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-lg font-bold text-stone-900 leading-none">
                            {boughtGifts}<span className="text-stone-400 text-sm font-normal">/{totalGifts}</span>
                        </div>
                        <Progress value={progressGifts} className="h-1" indicatorClassName="bg-rose-500" />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-stone-200">
                <CardContent className="p-3 flex flex-col justify-center h-full gap-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium uppercase tracking-wider">Convidados</span>
                        </div>
                        <span className="text-xs font-bold text-stone-700">{Math.round(progressGuests)}%</span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-lg font-bold text-stone-900 leading-none">
                            {confirmedGuests}<span className="text-stone-400 text-sm font-normal">/{totalGuests}</span>
                        </div>
                        <Progress value={progressGuests} className="h-1" indicatorClassName="bg-blue-500" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
