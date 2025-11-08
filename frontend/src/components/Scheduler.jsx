import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button, Dialog, DialogActions, DialogContent, TextField, DialogTitle } from '@mui/material';
import api from '../lib/api';
import '../css/Scheduler.css';

const localizer = momentLocalizer(moment);

const Scheduler = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', start: new Date(), end: new Date(), person: '', description: '' });
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const generateMonthlySchedule = () => {
    const events = [];
    const today = moment();
    const endOfMonth = moment().endOf('month');

    // Morning Stand-Ups: Only on Mondays, Wednesdays, and Thursdays
    for (let day = today.clone(); day.isBefore(endOfMonth); day.add(1, 'days')) {
      if (day.isoWeekday() === 1 || day.isoWeekday() === 3 || day.isoWeekday() === 4) {
        events.push({
          id: events.length,
          title: 'Morning Stand-Up',
          start: day.clone().hour(9).minute(0).toDate(),
          end: day.clone().hour(9).minute(15).toDate(),
          person: 'Development Team',
          description: 'Quick update on daily progress and blockers',
        });
      }
    }

    // Weekly Team Sync: Every Tuesday
    for (let day = today.clone().startOf('month'); day.isBefore(endOfMonth); day.add(1, 'weeks')) {
      events.push({
        id: events.length,
        title: 'Weekly Team Sync',
        start: day.clone().isoWeekday(2).hour(10).minute(0).toDate(),
        end: day.clone().isoWeekday(2).hour(11).minute(0).toDate(),
        person: 'All Teams',
        description: 'Weekly sync to discuss goals and challenges',
      });
    }

    // Project Review on Thursdays
    for (let day = today.clone().startOf('month'); day.isBefore(endOfMonth); day.add(1, 'weeks')) {
      events.push({
        id: events.length,
        title: 'Project Review',
        start: day.clone().isoWeekday(4).hour(14).minute(0).toDate(),
        end: day.clone().isoWeekday(4).hour(15).minute(0).toDate(),
        person: 'Project Management Team',
        description: 'Review progress, discuss next steps, and align on project milestones',
      });
    }

    // Monthly Planning Meeting: Third Thursday of the month
    const planningMeetingDate = today.clone().startOf('month').add(2, 'weeks').isoWeekday(4); // Third Thursday
    events.push({
      id: events.length,
      title: 'Monthly Planning Meeting',
      start: planningMeetingDate.clone().hour(11).minute(0).toDate(),
      end: planningMeetingDate.clone().hour(12).minute(30).toDate(),
      person: 'Leadership Team',
      description: 'Monthly meeting to plan projects and set goals',
    });

    // Bi-weekly Brainstorming Session on Thursdays
    for (let day = today.clone().startOf('month'); day.isBefore(endOfMonth); day.add(2, 'weeks')) {
      events.push({
        id: events.length,
        title: 'Brainstorming Session',
        start: day.clone().isoWeekday(4).hour(15).minute(0).toDate(),
        end: day.clone().isoWeekday(4).hour(16).minute(30).toDate(),
        person: 'Product and Development Teams',
        description: 'Brainstorming for new features and improvements',
      });
    }

    // Additional Ad-hoc Meeting on a Thursday
    events.push({
      id: events.length,
      title: 'Ad-hoc Planning Meeting',
      start: today.clone().startOf('month').add(3, 'weeks').isoWeekday(4).hour(13).minute(0).toDate(),
      end: today.clone().startOf('month').add(3, 'weeks').isoWeekday(4).hour(14).minute(0).toDate(),
      person: 'Project Leads',
      description: 'Spontaneous planning meeting to adjust project timelines',
    });

    return events;
  };

  // Initialize events with the generated monthly schedule
  const [events, setEvents] = useState(generateMonthlySchedule);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const backendEvents = await api.getEvents();
        const parsedBackendEvents = backendEvents.map(event => ({
          ...event,
          start: new Date(event.start_time || event.start),
          end: new Date(event.end_time || event.end),
          title: event.title,
          description: event.description || '',
        }));
        setEvents(prevEvents => [...prevEvents, ...parsedBackendEvents]);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  const handleSelectSlot = (slotInfo) => {
    setNewEvent({ title: '', start: slotInfo.start, end: slotInfo.end, person: '', description: '' });
    setDialogOpen(true);
  };

  const handleEventChange = (field) => (e) => {
    setNewEvent({ ...newEvent, [field]: e.target.value });
  };

  const handleDateChange = (field) => (e) => {
    setNewEvent({ ...newEvent, [field]: new Date(e.target.value) });
  };

  const handleAddEvent = async () => {
    if (isAddingEvent) {
      return; // Prevent duplicate execution
    }
    setIsAddingEvent(true);
    const newEventData = {
      title: newEvent.title,
      start: newEvent.start.toISOString(),
      end: newEvent.end.toISOString(),
      description: newEvent.description,
      location: newEvent.person, // Using person field as location
    };

    try {
      const savedEvent = await api.createEvent(newEventData);
      setEvents(prevEvents => [
        ...prevEvents,
        {
          ...savedEvent,
          start: new Date(savedEvent.start_time || savedEvent.start),
          end: new Date(savedEvent.end_time || savedEvent.end),
          person: savedEvent.location
        }
      ]);
      setDialogOpen(false);  // Close dialog only after successful addition
      setIsAddingEvent(false);
    } catch (error) {
      console.error("Error saving event:", error);
      setIsAddingEvent(false);
    }
  };

  const eventRenderer = ({ event }) => (
    <div>
      <strong>{event.title}</strong>
      <div>{event.person}</div>
      <div>{event.description}</div>
    </div>
  );

  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: '#FFFFFF',
      margin: '1rem auto',
      borderRadius: '16px',
      maxWidth: '1400px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
      border: '1px solid #E8E2D9'
    }}>
      <Calendar
        selectable
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={(event) => alert(event.description)}
        components={{
          event: eventRenderer,
        }}
        views={['month', 'week', 'day', 'agenda']}
      />

      {/* Dialog for adding new events */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add New Event</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Event Title"
            type="text"
            fullWidth
            value={newEvent.title}
            onChange={handleEventChange('title')}
          />
          <TextField
            margin="dense"
            label="Person/Team"
            type="text"
            fullWidth
            value={newEvent.person}
            onChange={handleEventChange('person')}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            value={newEvent.description}
            onChange={handleEventChange('description')}
          />
          <TextField
            margin="dense"
            label="Start Date"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={moment(newEvent.start).format('YYYY-MM-DDTHH:mm')}
            onChange={handleDateChange('start')}
          />
          <TextField
            margin="dense"
            label="End Date"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={moment(newEvent.end).format('YYYY-MM-DDTHH:mm')}
            onChange={handleDateChange('end')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddEvent} color="primary">
            Add Event
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Scheduler;
