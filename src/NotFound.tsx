import { useParams } from 'react-router-dom';

export default function NotFound() {
    const { roomId } = useParams();
    return (
        <div>NotFound {roomId} </div>
    )
}
