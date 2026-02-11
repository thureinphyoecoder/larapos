export default function ApplicationLogo(props) {
    const { className = "" } = props;

    return (
        <span className={`inline-flex items-center font-black tracking-tight text-orange-600 ${className}`}>
            LaraPee
        </span>
    );
}
