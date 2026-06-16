"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, MapPin } from "lucide-react";
import { getLocations, createLocation, deleteLocation } from "@/app/actions/locations";

type Location = {
  id: string;
  name: string;
  isDefault: boolean;
};

export function LocationsManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    const data = await getLocations();
    setLocations(data);
    setIsLoading(false);
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;
    const res = await createLocation(newLocationName);
    if (res.success) {
      setNewLocationName("");
      fetchLocations();
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Godown/Branch? Make sure it has no stock.")) return;
    const res = await deleteLocation(id);
    if (res.success) {
      fetchLocations();
    } else {
      alert(res.error);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          Godowns & Branches
        </CardTitle>
        <CardDescription>
          Manage your multiple shops, godowns, or branches. Inventory is tracked separately for each location.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading locations...</p>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2 items-end">
              <div className="space-y-2 flex-1">
                <Label>New Godown Name</Label>
                <Input 
                  placeholder="e.g. Godown 2, New Delhi Branch" 
                  value={newLocationName} 
                  onChange={(e) => setNewLocationName(e.target.value)} 
                />
              </div>
              <Button onClick={handleAddLocation} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>

            <div className="border rounded-md">
              {locations.map((loc, idx) => (
                <div key={loc.id} className={`flex items-center justify-between p-4 ${idx !== locations.length - 1 ? 'border-b' : ''}`}>
                  <div>
                    <h4 className="font-medium text-slate-800 flex items-center gap-2">
                      {loc.name}
                      {loc.isDefault && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Main Location</span>}
                    </h4>
                  </div>
                  {!loc.isDefault && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(loc.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {locations.length === 0 && (
                <div className="p-4 text-center text-slate-500">No locations found.</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
