import { useState } from "react";
import { useLoaderData, Form, Link, useSubmit } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar as CalendarIcon, MapPin, Clock, Trash2, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "./+types/calendar";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Agenda - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);

    // Fetch manual events
    const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

    // Fetch checklist items with due_date
    const { data: tasks, error: tasksError } = await supabase
        .from("checklist_items")
        .select("id, title, due_date, status")
        .not("due_date", "is", null);

    if (eventsError) console.error("Error fetching events:", eventsError);
    if (tasksError) console.error("Error fetching tasks:", tasksError);

    return {
        events: events || [],
        tasks: tasks || []
    };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);

    if (intent === "add_event") {
        const title = formData.get("title") as string;
        const date = formData.get("date") as string;
        const time = formData.get("time") as string;
        const location = formData.get("location") as string;
        const notes = formData.get("notes") as string;

        if (title && date) {
            const start_date = time ? `${date}T${time}:00` : `${date}T00:00:00`;

            await supabase.from("events").insert({
                title,
                start_date,
                location,
                notes,
                type: "manual"
            });
        }
    } else if (intent === "delete_event") {
        const id = formData.get("id") as string;
        await supabase.from("events").delete().eq("id", id);
    }

    return null;
};

export default function CalendarPage() {
    const { events, tasks } = useLoaderData<typeof loader>();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isAddingEvent, setIsAddingEvent] = useState(false);

    // Combine events and tasks
    const allItems = [
        ...events.map((e: any) => ({
            ...e,
            date: new Date(e.start_date),
            isTask: false
        })),
        ...tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            // Fix: Append T12:00:00 to ensure it's treated as local date (middle of day) to avoid timezone shifts
            date: new Date(t.due_date + 'T12:00:00'),
            isTask: true,
            status: t.status
        }))
    ];

    // Calendar Logic
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const getItemsForDay = (date: Date) => {
        return allItems.filter(item => {
            // Adjust for timezone issues if necessary, but simple comparison for now
            // Assuming item.date is a Date object
            // Need to handle string dates from JSON if not automatically converted?
            // Loader returns JSON, so dates are strings.
            const itemDate = new Date(item.date);
            // Fix timezone offset for YYYY-MM-DD strings which default to UTC
            // If due_date is YYYY-MM-DD, new Date() might be previous day in local time depending on browser
            // Let's rely on simple string comparison for YYYY-MM-DD parts to be safe

            const itemY = itemDate.getFullYear();
            const itemM = itemDate.getMonth();
            const itemD = itemDate.getDate();

            // Better approach: Compare ISO strings YYYY-MM-DD
            // But item.date might be full timestamp for events

            return itemY === date.getFullYear() && itemM === date.getMonth() && itemD === date.getDate();
        });
    };

    // Fix timezone issues by using UTC methods or string splitting for YYYY-MM-DD
    // Actually, let's just use a helper that respects local time for display
    const selectedItems = getItemsForDay(selectedDate);

    return (
        <div className="p-4 space-y-6 pb-20">
            <header className="flex justify-end items-center">
                <Button size="sm" onClick={() => setIsAddingEvent(!isAddingEvent)}>
                    <Plus className="h-4 w-4 mr-2" /> Novo Evento
                </Button>
            </header>

            {/* Adicionar Evento */}
            {isAddingEvent && (
                <Card className="animate-in slide-in-from-top-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Novo Compromisso</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form method="post" className="space-y-3" onSubmit={() => setIsAddingEvent(false)}>
                            <Input name="title" placeholder="Título (ex: Degustação Buffet)" required />
                            <div className="flex gap-2">
                                <Input type="date" name="date" required className="flex-1" defaultValue={selectedDate.toISOString().split('T')[0]} />
                                <Input type="time" name="time" className="w-24" />
                            </div>
                            <Input name="location" placeholder="Local (Opcional)" />
                            <Textarea name="notes" placeholder="Notas..." className="h-20" />
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingEvent(false)}>Cancelar</Button>
                                <Button type="submit" name="intent" value="add_event" size="sm">Salvar</Button>
                            </div>
                        </Form>
                    </CardContent>
                </Card>
            )}

            {/* Calendário */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <Button variant="ghost" size="icon" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-medium text-lg">{monthNames[month]} {year}</span>
                        <Button variant="ghost" size="icon" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                            <span key={i} className="text-xs text-muted-foreground font-medium">{d}</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((date, i) => {
                            if (!date) return <div key={i} className="h-10" />;

                            const isSelected = isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, new Date());
                            const dayItems = getItemsForDay(date);
                            const hasEvent = dayItems.some(i => !i.isTask);
                            const hasTask = dayItems.some(i => i.isTask);

                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(date)}
                                    className={`
                                        h-10 rounded-md flex flex-col items-center justify-center relative transition-colors
                                        ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}
                                        ${isToday && !isSelected ? "border border-primary text-primary" : ""}
                                    `}
                                >
                                    <span className="text-sm">{date.getDate()}</span>
                                    <div className="flex gap-0.5 mt-0.5">
                                        {hasEvent && <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`} />}
                                        {hasTask && <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-green-500"}`} />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Lista do Dia */}
            <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">
                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>

                {selectedItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm bg-secondary/20 rounded-lg border border-dashed">
                        Nada agendado para este dia.
                    </div>
                ) : (
                    selectedItems.map((item: any, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border flex items-start gap-3 hover:scale-[1.02] transition-all duration-300 hover:shadow-md ${item.isTask ? 'bg-green-50/50 border-green-100' : 'bg-blue-50/50 border-blue-100'}`}>
                            <div className={`mt-1 p-1.5 rounded-full ${item.isTask ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                {item.isTask ? <CheckSquare className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-medium text-sm ${item.isTask && item.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}>
                                        {item.title}
                                    </h4>
                                    {!item.isTask && (
                                        <Form method="post">
                                            <input type="hidden" name="id" value={item.id} />
                                            <button type="submit" name="intent" value="delete_event" className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </Form>
                                    )}
                                </div>

                                {!item.isTask && (
                                    <div className="space-y-1 mt-1">
                                        {item.start_date.includes('T') && !item.start_date.endsWith('T00:00:00') && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {new Date(item.start_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                        {item.location && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                {item.location}
                                            </div>
                                        )}
                                        {item.notes && (
                                            <p className="text-xs text-muted-foreground mt-1 bg-white/50 p-1.5 rounded">
                                                {item.notes}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {item.isTask && (
                                    <div className="mt-1">
                                        <Link to="/checklist" className="text-xs text-primary hover:underline">
                                            Ver no checklist
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
