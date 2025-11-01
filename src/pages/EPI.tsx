import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EPITable from "@/components/epi/EPITable";
import EPIFormModal from "@/components/epi/EPIFormModal";
import { fetchEPIStats } from "@/lib/epi-queries";

export default function EPI() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["epi-stats"],
    queryFn: () => fetchEPIStats(),
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Équipements de Protection Individuelle</h1>
            <p className="text-muted-foreground mt-1">
              Gestion complète du stock, des dotations et du suivi des EPI
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel article EPI
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total EPI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.enStock || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attribués</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.attribue || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis au rebut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">{stats?.misAuRebut || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau principal */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Tous les EPI</TabsTrigger>
            <TabsTrigger value="en_stock">En stock</TabsTrigger>
            <TabsTrigger value="attribue">Attribués</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <EPITable />
          </TabsContent>

          <TabsContent value="en_stock" className="space-y-4">
            <EPITable statusFilter="en_stock" />
          </TabsContent>

          <TabsContent value="attribue" className="space-y-4">
            <EPITable statusFilter="attribue" />
          </TabsContent>
        </Tabs>

        <EPIFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      </div>
  );
}
