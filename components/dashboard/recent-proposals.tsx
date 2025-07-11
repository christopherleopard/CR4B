"use client"

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Trash2 } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RecentProposals() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposals = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("proposals") // replace with your actual table name
        .select("*")
        .order("id", { ascending: false })
        .limit(10); // adjust as needed

      if (error) {
        console.error("Error fetching proposals:", error);
        setProposals([]);
      } else {
        setProposals(data);
      }
      setLoading(false);
    };

    fetchProposals();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Proposals</CardTitle>
        <CardDescription>View and manage your recent proposals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Title</th>
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-right py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal: any) => (
                  <tr key={proposal.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <Link href={`/proposals/${proposal.id}`} className="font-medium hover:text-purple-600">
                        {proposal.job_title || proposal.title}
                      </Link>
                    </td>
                    <td className="py-3 px-2">{proposal.created_at ? new Date(proposal.created_at).toLocaleDateString() : "-"}</td>
                    <td className="py-3 px-2">
                      <Badge
                        variant={
                          proposal.status === "Won"
                            ? "success"
                            : proposal.status === "Lost"
                              ? "destructive"
                              : proposal.status === "Sent"
                                ? "default"
                                : "outline"
                        }
                      >
                        {proposal.status || "Sent"}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}