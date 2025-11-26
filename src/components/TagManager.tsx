import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";
import { 
  tagsQueries, 
  texteTagsQueries, 
  articleTagsQueries, 
  ReglementaireTag,
  TexteTag,
  ArticleTag 
} from "@/lib/tags-queries";

interface TagManagerProps {
  entityId: string;
  entityType: "texte" | "article";
  onTagsChange?: () => void;
}

export function TagManager({ entityId, entityType, onTagsChange }: TagManagerProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [showNewTagInput, setShowNewTagInput] = useState(false);

  // Fetch all available tags
  const { data: allTags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagsQueries.getAll(),
  });

  // Fetch tags for this entity
  const queryKey = entityType === "texte" 
    ? ["texte-tags", entityId]
    : ["article-tags", entityId];

  const { data: entityTags = [] } = useQuery<Array<TexteTag | ArticleTag>>({
    queryKey,
    queryFn: () => {
      if (entityType === "texte") {
        return texteTagsQueries.getByTexteId(entityId);
      } else {
        return articleTagsQueries.getByArticleId(entityId);
      }
    },
  });

  const assignedTagIds = (entityTags as Array<{ tag_id: string }>).map(et => et.tag_id);
  const availableTags = allTags.filter(tag => !assignedTagIds.includes(tag.id));

  // Mutation to add tag
  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (entityType === "texte") {
        return texteTagsQueries.addTag(entityId, tagId);
      } else {
        return articleTagsQueries.addTag(entityId, tagId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag ajouté");
      setOpen(false);
      onTagsChange?.();
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'ajout du tag", {
        description: error.message,
      });
    },
  });

  // Mutation to remove tag
  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (entityType === "texte") {
        return texteTagsQueries.removeTag(entityId, tagId);
      } else {
        return articleTagsQueries.removeTag(entityId, tagId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Tag retiré");
      onTagsChange?.();
    },
    onError: (error: Error) => {
      toast.error("Erreur lors du retrait du tag", {
        description: error.message,
      });
    },
  });

  // Mutation to create new tag
  const createTagMutation = useMutation({
    mutationFn: (label: string) => tagsQueries.create({ label }),
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      addTagMutation.mutate(newTag.id);
      setNewTagLabel("");
      setShowNewTagInput(false);
      toast.success("Tag créé et ajouté");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la création du tag", {
        description: error.message,
      });
    },
  });

  const handleAddTag = (tagId: string) => {
    addTagMutation.mutate(tagId);
  };

  const handleRemoveTag = (tagId: string) => {
    removeTagMutation.mutate(tagId);
  };

  const handleCreateNewTag = () => {
    if (newTagLabel.trim()) {
      createTagMutation.mutate(newTagLabel.trim());
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        {(entityTags as Array<TexteTag | ArticleTag>).map((et) => (
          <Badge
            key={et.id}
            variant="secondary"
            style={et.reglementaire_tags?.couleur ? { backgroundColor: et.reglementaire_tags.couleur } : undefined}
            className="flex items-center gap-1"
          >
            <TagIcon className="h-3 w-3" />
            {et.reglementaire_tags?.label}
            <button
              onClick={() => handleRemoveTag(et.tag_id)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Rechercher un tag..." />
              <CommandList>
                <CommandEmpty>
                  <div className="p-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Aucun tag trouvé</p>
                    {!showNewTagInput ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewTagInput(true)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Créer un nouveau tag
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nom du tag..."
                          value={newTagLabel}
                          onChange={(e) => setNewTagLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleCreateNewTag();
                            }
                          }}
                        />
                        <Button size="sm" onClick={handleCreateNewTag}>
                          Créer
                        </Button>
                      </div>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {availableTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleAddTag(tag.id)}
                    >
                      <Badge
                        variant="secondary"
                        style={tag.couleur ? { backgroundColor: tag.couleur } : undefined}
                      >
                        {tag.label}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
