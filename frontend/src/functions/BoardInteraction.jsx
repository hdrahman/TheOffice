import { useNavigate } from 'react-router-dom';

const BoardInteraction = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/schedule');
  };

  return handleClick;
};

export default BoardInteraction;