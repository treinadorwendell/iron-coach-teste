'use client';

import React, { useState, useEffect } from 'react';
import {
  MainNavSection,
  Client,
  WorkoutProgram,
  CalendarEvent,
} from '@/types';
import {
  storage,
  INITIAL_CLIENTS,
  INITIAL_WORKOUTS,
  INITIAL_CALENDAR,
} from '@/lib/storage';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { ClientSection } from '@/components/ClientSection';
import { AgendaSection } from '@/components/AgendaSection';
import { CreateWorkoutSection } from '@/components/CreateWorkoutSection';
import { WorkoutExecutionSection } from '@/components/WorkoutExecutionSection';

export default function Home() {
  const [currentSection, setCurrentSection] = useState<MainNavSection>('execucao');
  const [isTabletFramed, setIsTabletFramed] = useState(false);

  // Initialize with deterministic seed data matching SSR server HTML
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [workouts, setWorkouts] = useState<WorkoutProgram[]>(INITIAL_WORKOUTS);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR);

  // Cross-navigation context
  const [preSelectedClientId, setPreSelectedClientId] = useState<string | undefined>(undefined);
  const [activeWorkoutForExecution, setActiveWorkoutForExecution] =
    useState<WorkoutProgram | null>(INITIAL_WORKOUTS[0]);

  // Safely hydrate any customized data from client storage after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const loadedClients = storage.getClients();
      const loadedWorkouts = storage.getWorkouts();
      const loadedCalendar = storage.getCalendarEvents();

      setClients(loadedClients);
      setWorkouts(loadedWorkouts);
      setCalendarEvents(loadedCalendar);

      if (loadedWorkouts.length > 0) {
        setActiveWorkoutForExecution(loadedWorkouts[0]);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // CLIENT HANDLERS
  const handleAddClient = (newClient: Client) => {
    const updated = [newClient, ...clients];
    setClients(updated);
    storage.saveClients(updated);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    const updated = clients.map((c) =>
      c.id === updatedClient.id ? updatedClient : c
    );
    setClients(updated);
    storage.saveClients(updated);
  };

  const handleDeleteClient = (clientId: string) => {
    const updatedClients = clients.filter((c) => c.id !== clientId);
    setClients(updatedClients);
    storage.saveClients(updatedClients);

    // Cascade clean up workouts
    const updatedWorkouts = workouts.filter((w) => w.clientId !== clientId);
    setWorkouts(updatedWorkouts);
    storage.saveWorkouts(updatedWorkouts);

    // Cascade clean up calendar events
    const updatedEvents = calendarEvents.filter((e) => e.clientId !== clientId);
    setCalendarEvents(updatedEvents);
    storage.saveCalendarEvents(updatedEvents);

    if (activeWorkoutForExecution?.clientId === clientId) {
      setActiveWorkoutForExecution(updatedWorkouts[0] || null);
    }
  };

  // WORKOUT HANDLERS
  const handleSaveWorkout = (newWorkout: WorkoutProgram) => {
    const existingIndex = workouts.findIndex((w) => w.id === newWorkout.id);
    let updated: WorkoutProgram[];
    if (existingIndex >= 0) {
      updated = [...workouts];
      updated[existingIndex] = newWorkout;
    } else {
      updated = [newWorkout, ...workouts];
    }
    setWorkouts(updated);
    storage.saveWorkouts(updated);
    setActiveWorkoutForExecution(newWorkout);
  };

  const handleDeleteWorkout = (workoutId: string) => {
    const updated = workouts.filter((w) => w.id !== workoutId);
    setWorkouts(updated);
    storage.saveWorkouts(updated);
    if (activeWorkoutForExecution?.id === workoutId) {
      setActiveWorkoutForExecution(updated[0] || null);
    }
  };

  // CALENDAR HANDLERS
  const handleAddCalendarEvent = (newEvent: CalendarEvent) => {
    const updated = [newEvent, ...calendarEvents];
    setCalendarEvents(updated);
    storage.saveCalendarEvents(updated);
  };

  const handleUpdateCalendarEvent = (updatedEvent: CalendarEvent) => {
    const updated = calendarEvents.map((e) =>
      e.id === updatedEvent.id ? updatedEvent : e
    );
    setCalendarEvents(updated);
    storage.saveCalendarEvents(updated);
  };

  const handleDeleteCalendarEvent = (eventId: string) => {
    const updated = calendarEvents.filter((e) => e.id !== eventId);
    setCalendarEvents(updated);
    storage.saveCalendarEvents(updated);
  };

  // CROSS-TAB ACTIONS
  const handleStartWorkoutForClient = (client: Client) => {
    const clientWorkout = workouts.find((w) => w.clientId === client.id) || workouts[0];
    if (clientWorkout) {
      setActiveWorkoutForExecution(clientWorkout);
    }
    setCurrentSection('execucao');
  };

  const handleCreateWorkoutForClient = (client: Client) => {
    setPreSelectedClientId(client.id);
    setCurrentSection('criar-treino');
  };

  const handleStartExecutionFromBuilder = (workout: WorkoutProgram) => {
    setActiveWorkoutForExecution(workout);
    setCurrentSection('execucao');
  };

  // Active student name in execution
  const activeClient = clients.find(
    (c) => c.id === activeWorkoutForExecution?.clientId
  );

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center transition-all ${
        isTabletFramed ? 'py-4 sm:py-8 px-2 sm:px-4 bg-slate-900/60' : ''
      }`}
    >
      {/* Tablet Portrait Frame Wrapper (Aspect Ratio ~3:4 / Touch Screen) */}
      <div
        className={`w-full flex-1 flex flex-col transition-all relative ${
          isTabletFramed
            ? 'max-w-[768px] min-h-[960px] bg-slate-950 rounded-[32px] border-[8px] border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden ring-1 ring-slate-700/50'
            : 'max-w-4xl mx-auto'
        }`}
      >
        {/* Tablet Camera / Speaker Notch Simulation (when framed) */}
        {isTabletFramed && (
          <div className="w-full flex justify-center py-2 bg-slate-950 select-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
              <span className="w-10 h-1.5 rounded-full bg-slate-800" />
            </div>
          </div>
        )}

        {/* Global Header */}
        <Header
          isTabletFramed={isTabletFramed}
          onToggleTabletFrame={() => setIsTabletFramed(!isTabletFramed)}
          activeClientName={
            currentSection === 'execucao' ? activeClient?.name : undefined
          }
        />

        {/* Main Section Content */}
        <main className="flex-1 p-3 sm:p-5 overflow-y-auto">
          {currentSection === 'cliente' && (
            <ClientSection
              clients={clients}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onStartWorkoutForClient={handleStartWorkoutForClient}
              onCreateWorkoutForClient={handleCreateWorkoutForClient}
            />
          )}

          {currentSection === 'agenda' && (
            <AgendaSection
              events={calendarEvents}
              clients={clients}
              onAddEvent={handleAddCalendarEvent}
              onUpdateEvent={handleUpdateCalendarEvent}
              onDeleteEvent={handleDeleteCalendarEvent}
              onStartWorkoutForClient={handleStartWorkoutForClient}
            />
          )}

          {currentSection === 'criar-treino' && (
            <CreateWorkoutSection
              clients={clients}
              workouts={workouts}
              preSelectedClientId={preSelectedClientId}
              onSaveWorkout={handleSaveWorkout}
              onDeleteWorkout={handleDeleteWorkout}
              onStartExecution={handleStartExecutionFromBuilder}
            />
          )}

          {currentSection === 'execucao' && (
            <WorkoutExecutionSection
              clients={clients}
              workouts={workouts}
              activeWorkout={activeWorkoutForExecution}
              onSelectWorkout={(w) => setActiveWorkoutForExecution(w)}
              onNavigateToCreateWorkout={(clientId) => {
                setPreSelectedClientId(clientId);
                setCurrentSection('criar-treino');
              }}
              onFinishWorkout={() => {
                // Return to client list or stay
              }}
            />
          )}
        </main>

        {/* Fixed Touch-Friendly Bottom Navigation Bar */}
        <BottomNav
          currentSection={currentSection}
          onSelectSection={(sec) => setCurrentSection(sec)}
          hasActiveSession={true}
        />
      </div>
    </div>
  );
}
