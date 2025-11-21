import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  nom?: string;
  prenom?: string;
  avatarUrl?: string;
  className?: string;
}

export function UserAvatar({ nom, prenom, avatarUrl, className }: UserAvatarProps) {
  // Generate initials from name
  const getInitials = () => {
    const firstInitial = prenom?.charAt(0)?.toUpperCase() || "";
    const lastInitial = nom?.charAt(0)?.toUpperCase() || "";
    return firstInitial + lastInitial || "U";
  };

  // Generate consistent color based on name
  const getAvatarColor = () => {
    const name = `${prenom}${nom}`.toLowerCase();
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-indigo-500",
      "bg-rose-500",
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Avatar className={cn("h-10 w-10 border-2 border-background shadow-sm", className)}>
      <AvatarImage src={avatarUrl} alt={`${prenom} ${nom}`} />
      <AvatarFallback className={cn("text-white font-medium", getAvatarColor())}>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}
