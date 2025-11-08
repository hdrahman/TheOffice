// ...existing code...
async function fetchTodayEvents() {
  try {
    const response = await fetch('/api/today-events');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching events:', error);
    return []; // Return an empty array or handle the error as needed
  }
}
// ...existing code...
useEffect(() => {
  const loadEvents = async () => {
    const events = await fetchTodayEvents();
    setEvents(events);
  };
  loadEvents();
}, []);
// ...existing code...
