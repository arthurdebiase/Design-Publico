import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, CloudIcon, ImageIcon, UploadIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react';

export default function CloudinaryAdminPage() {
  const { toast } = useToast();
  const [maxRecords, setMaxRecords] = useState(100);
  const [batchSize, setBatchSize] = useState(10);
  const [delay, setDelay] = useState(1000);
  const [migrationType, setMigrationType] = useState('screens'); // 'screens' or 'logos'
  const [testUrl, setTestUrl] = useState('');
  const [testAppName, setTestAppName] = useState('');
  const [testScreenName, setTestScreenName] = useState('');

  // Get Cloudinary status
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/cloudinary/status'],
    queryFn: async () => {
      const response = await axios.get('/api/cloudinary/status');
      return response.data;
    }
  });

  // Migrate Mutation
  const migrationMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/api/cloudinary/migrate?maxRecords=${maxRecords}&batchSize=${batchSize}&delayBetweenBatches=${delay}&type=${migrationType}`);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Migration Started",
        description: `Migration process has started in the background. ${data.message}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Migration Failed",
        description: `Error: ${error.response?.data?.message || error.message}`,
        variant: "destructive",
      });
    }
  });

  // Test Upload Mutation
  const testUploadMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/cloudinary/test-upload', {
        imageUrl: testUrl,
        appName: testAppName,
        screenName: testScreenName
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Test Upload Successful",
        description: `Image uploaded to Cloudinary! URL: ${data.data.secure_url.substring(0, 50)}...`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Upload Failed",
        description: `Error: ${error.response?.data?.message || error.message}`,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Cloudinary Migration Tool</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetchStatus()}
          disabled={statusLoading}
        >
          Refresh Status
        </Button>
      </div>

      {/* Status Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudIcon className="h-5 w-5" />
            Cloudinary Status
          </CardTitle>
          <CardDescription>
            Current connection status with Cloudinary service
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
              <span>Checking status...</span>
            </div>
          ) : statusData?.configured ? (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <AlertTitle>Connected</AlertTitle>
              <AlertDescription>
                Cloudinary is properly configured with cloud name: <strong>{statusData.cloudName}</strong>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Not Configured</AlertTitle>
              <AlertDescription>
                Cloudinary is not properly configured. Please check your environment variables.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="migration">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="migration">Batch Migration</TabsTrigger>
          <TabsTrigger value="test-upload">Test Upload</TabsTrigger>
        </TabsList>

        {/* Migration Tab */}
        <TabsContent value="migration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadIcon className="h-5 w-5" />
                Batch Migration
              </CardTitle>
              <CardDescription>
                Migrate images from Airtable to Cloudinary in batches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="migrationType">Migration Type</Label>
                  <select 
                    id="migrationType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={migrationType}
                    onChange={(e) => setMigrationType(e.target.value)}
                  >
                    <option value="screens">Screen Images</option>
                    <option value="logos">App Logos</option>
                  </select>
                  <p className="text-xs text-gray-500">Select whether to migrate screen images or app logos</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="maxRecords">Max Records</Label>
                  <Input
                    id="maxRecords"
                    type="number"
                    min="1"
                    max="1000"
                    value={maxRecords}
                    onChange={(e) => setMaxRecords(parseInt(e.target.value) || 100)}
                  />
                  <p className="text-xs text-gray-500">Maximum number of records to process</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchSize">Batch Size</Label>
                  <Input
                    id="batchSize"
                    type="number"
                    min="1"
                    max="50"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                  />
                  <p className="text-xs text-gray-500">Number of images to process in one batch</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delay">Delay Between Batches (ms)</Label>
                  <Input
                    id="delay"
                    type="number"
                    min="0"
                    max="10000"
                    value={delay}
                    onChange={(e) => setDelay(parseInt(e.target.value) || 1000)}
                  />
                  <p className="text-xs text-gray-500">Time to wait between batches</p>
                </div>
              </div>

              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription>
                  Migration runs in the background. You can check the console logs to track progress.
                  The migration will only process images that don't already have a Cloudinary URL in the "importing" column.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => migrationMutation.mutate()}
                disabled={migrationMutation.isPending || !statusData?.configured}
              >
                {migrationMutation.isPending ? 'Starting Migration...' : 'Start Migration'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Test Upload Tab */}
        <TabsContent value="test-upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Test Image Upload
              </CardTitle>
              <CardDescription>
                Test uploading a single image to Cloudinary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500">URL of the image to upload (Airtable or any other source)</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appName">App Name</Label>
                  <Input
                    id="appName"
                    placeholder="Test App"
                    value={testAppName}
                    onChange={(e) => setTestAppName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="screenName">Screen Name</Label>
                  <Input
                    id="screenName"
                    placeholder="Test Screen"
                    value={testScreenName}
                    onChange={(e) => setTestScreenName(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => testUploadMutation.mutate()}
                disabled={testUploadMutation.isPending || !testUrl || !statusData?.configured}
              >
                {testUploadMutation.isPending ? 'Uploading...' : 'Test Upload'}
              </Button>
            </CardFooter>
          </Card>

          {testUploadMutation.isSuccess && (
            <div className="mt-4">
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <AlertTitle>Upload Successful</AlertTitle>
                <AlertDescription>
                  <div>URL: <a href={testUploadMutation.data.data.secure_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{testUploadMutation.data.data.secure_url}</a></div>
                  <div className="mt-2">
                    <img src={testUploadMutation.data.data.secure_url} alt="Uploaded" className="max-w-full max-h-64 object-contain border rounded mt-2" />
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}