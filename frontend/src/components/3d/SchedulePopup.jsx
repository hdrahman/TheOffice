import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Dialog, DialogTitle, DialogContent, Button } from '@mui/material';

const SchedulePopup = () => {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [todayEvents, setTodayEvents] = useState([]);

  useEffect(() => {
    const fetchTodayEvents = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/events");
        if (!response.ok) throw new Error("Failed to fetch events");

        const events = await response.json();
        const today = moment().startOf('day');

        // Filter events scheduled for today
        const filteredEvents = events
          .map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          }))
          .filter(event => moment(event.start).isSame(today, 'day'));

        setTodayEvents(filteredEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchTodayEvents();
  }, []);

  const toggleSchedulePopup = () => {
    setIsScheduleOpen(!isScheduleOpen);
  };

  return (
    <div className="fixed bottom-4 left-4 bg-surface rounded-2xl shadow-2xl overflow-hidden border border-border">
      {!isScheduleOpen && (
        <div
          onClick={toggleSchedulePopup}
          className="cursor-pointer w-72 bg-brown text-white text-center py-3 rounded-2xl shadow-lg hover:bg-primary-hover transition duration-200 font-medium"
        >
          Today&apos;s Schedule
        </div>
      )}

      {isScheduleOpen && (
        <div className="p-3 space-y-3 overflow-y-auto h-72 w-72">
          <div className="sticky top-0 bg-surface z-10 p-2 border-b border-border flex justify-between items-center">
            <div className="font-bold text-text-primary">Today&apos;s Schedule</div>
            <button onClick={toggleSchedulePopup} className="text-text-secondary hover:text-text-primary">
              ✕
            </button>
          </div>
          {todayEvents.length > 0 ? (
            todayEvents.map(event => (
              <div key={event.id} className="p-2 rounded-lg border-b border-border hover:bg-primary-tint transition duration-200">
                <div className="font-medium text-text-primary">{event.title}</div>
                <div className="text-xs text-text-secondary">
                  {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                </div>
                <div className="text-xs text-text-secondary">{event.person}</div>
                <div className="text-xs text-text-secondary">{event.description}</div>
              </div>
            ))
          ) : (
            <p className="text-text-secondary text-sm">No events scheduled for today!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SchedulePopup;
