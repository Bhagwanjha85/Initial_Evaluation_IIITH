import React, { useState } from 'react';
import { Upload, Play, Download, FileAudio, FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';

const MFAAlignmentTool = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const handleFileUpload = (e, type) => {
    const uploadedFiles = Array.from(e.target.files);
    const newFiles = uploadedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      file: file,
      type: type,
      transcript: type === 'audio' ? '' : null
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setError('');
  };

  const handleTranscriptChange = (id, text) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, transcript: text } : f
    ));
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processAlignment = async () => {
    setProcessing(true);
    setError('');
    setResults([]);

    try {
      // Validate files
      const audioFiles = files.filter(f => f.type === 'audio');

      if (audioFiles.length === 0) {
        throw new Error('Please upload at least one audio file');
      }

      // Simulate processing for each audio file
      const alignmentResults = [];

      for (const audioFile of audioFiles) {
        if (!audioFile.transcript || audioFile.transcript.trim() === '') {
          throw new Error(`Missing transcript for ${audioFile.name}`);
        }

        // Simulate alignment processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate mock alignment data
        const words = audioFile.transcript.toUpperCase().split(/\s+/);
        let currentTime = 0;
        const wordAlignments = [];
        const phoneAlignments = [];

        for (const word of words) {
          const wordDuration = 0.3 + Math.random() * 0.4; // 300-700ms per word
          wordAlignments.push({
            word: word,
            start: currentTime.toFixed(3),
            end: (currentTime + wordDuration).toFixed(3),
            duration: wordDuration.toFixed(3)
          });

          // Generate phoneme alignments for this word
          const phoneCount = Math.max(2, Math.floor(word.length * 0.6));
          const phoneDuration = wordDuration / phoneCount;

          for (let i = 0; i < phoneCount; i++) {
            phoneAlignments.push({
              phone: ['AH', 'EH', 'IH', 'OW', 'UW', 'B', 'D', 'K', 'L', 'M', 'N', 'R', 'S', 'T', 'TH', 'W'][Math.floor(Math.random() * 16)],
              start: currentTime.toFixed(3),
              end: (currentTime + phoneDuration).toFixed(3),
              duration: phoneDuration.toFixed(3)
            });
            currentTime += phoneDuration;
          }
        }

        alignmentResults.push({
          fileName: audioFile.name,
          transcript: audioFile.transcript,
          totalDuration: currentTime.toFixed(3),
          wordCount: words.length,
          phoneCount: phoneAlignments.length,
          wordAlignments: wordAlignments,
          phoneAlignments: phoneAlignments,
          avgWordDuration: (wordAlignments.reduce((sum, w) => sum + parseFloat(w.duration), 0) / wordAlignments.length).toFixed(3),
          avgPhoneDuration: (phoneAlignments.reduce((sum, p) => sum + parseFloat(p.duration), 0) / phoneAlignments.length).toFixed(3)
        });
      }

      setResults(alignmentResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadTextGrid = (result) => {
    let textGridContent = `File type = "ooTextFile"\nObject class = "TextGrid"\n\n`;
    textGridContent += `xmin = 0\nxmax = ${result.totalDuration}\ntiers? <exists>\nsize = 2\nitem []:\n`;

    // Word tier
    textGridContent += `    item [1]:\n        class = "IntervalTier"\n        name = "words"\n`;
    textGridContent += `        xmin = 0\n        xmax = ${result.totalDuration}\n`;
    textGridContent += `        intervals: size = ${result.wordAlignments.length}\n`;

    result.wordAlignments.forEach((word, idx) => {
      textGridContent += `        intervals [${idx + 1}]:\n`;
      textGridContent += `            xmin = ${word.start}\n`;
      textGridContent += `            xmax = ${word.end}\n`;
      textGridContent += `            text = "${word.word}"\n`;
    });

    // Phone tier
    textGridContent += `    item [2]:\n        class = "IntervalTier"\n        name = "phones"\n`;
    textGridContent += `        xmin = 0\n        xmax = ${result.totalDuration}\n`;
    textGridContent += `        intervals: size = ${result.phoneAlignments.length}\n`;

    result.phoneAlignments.forEach((phone, idx) => {
      textGridContent += `        intervals [${idx + 1}]:\n`;
      textGridContent += `            xmin = ${phone.start}\n`;
      textGridContent += `            xmax = ${phone.end}\n`;
      textGridContent += `            text = "${phone.phone}"\n`;
    });

    const blob = new Blob([textGridContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName.replace('.wav', '.TextGrid');
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadReport = (result) => {
    let report = `FORCED ALIGNMENT REPORT\n`;
    report += `${'='.repeat(80)}\n\n`;
    report += `File: ${result.fileName}\n`;
    report += `Transcript: ${result.transcript}\n`;
    report += `Total Duration: ${result.totalDuration}s\n`;
    report += `Word Count: ${result.wordCount}\n`;
    report += `Phoneme Count: ${result.phoneCount}\n`;
    report += `Average Word Duration: ${result.avgWordDuration}s\n`;
    report += `Average Phoneme Duration: ${result.avgPhoneDuration}s\n\n`;

    report += `WORD ALIGNMENTS\n`;
    report += `${'-'.repeat(80)}\n`;
    report += `Word                 Start Time    End Time      Duration\n`;
    report += `${'-'.repeat(80)}\n`;

    result.wordAlignments.forEach(word => {
      report += `${word.word.padEnd(20)} ${word.start.padStart(10)}s   ${word.end.padStart(10)}s   ${word.duration.padStart(10)}s\n`;
    });

    report += `\n\nPHONEME ALIGNMENTS\n`;
    report += `${'-'.repeat(80)}\n`;
    report += `Phoneme    Start Time    End Time      Duration\n`;
    report += `${'-'.repeat(80)}\n`;

    result.phoneAlignments.forEach(phone => {
      report += `${phone.phone.padEnd(10)} ${phone.start.padStart(10)}s   ${phone.end.padStart(10)}s   ${phone.duration.padStart(10)}s\n`;
    });

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName.replace('.wav', '_report.txt');
    a.click();
    URL.revokeObjectURL(url);
  };

  const audioFiles = files.filter(f => f.type === 'audio');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-indigo-600 p-3 rounded-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                MFA Forced Alignment Tool
              </h1>
              <p className="text-gray-600">
                Upload audio files with transcripts to get word and phoneme timing alignments
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 className="font-bold text-blue-900 mb-2">How to use:</h3>
            <ol className="list-decimal list-inside text-blue-800 text-sm space-y-1">
              <li>Upload WAV audio files (one or multiple)</li>
              <li>Enter the transcript for each audio file</li>
              <li>Click "Run Alignment" to process</li>
              <li>Download TextGrid files and timing reports</li>
            </ol>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6 text-indigo-600" />
            Upload Audio Files
          </h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition">
            <input
              type="file"
              accept=".wav"
              multiple
              onChange={(e) => handleFileUpload(e, 'audio')}
              className="hidden"
              id="audio-upload"
            />
            <label
              htmlFor="audio-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <FileAudio className="w-12 h-12 text-gray-400" />
              <span className="text-gray-600">
                Click to upload WAV files or drag and drop
              </span>
              <span className="text-sm text-gray-500">
                Supports multiple files
              </span>
            </label>
          </div>

          {/* File List with Transcripts */}
          {audioFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              {audioFiles.map(file => (
                <div key={file.id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-start gap-4">
                    <FileAudio className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">{file.name}</h3>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <textarea
                        placeholder="Enter transcript here (e.g., HELLO WORLD)"
                        value={file.transcript}
                        onChange={(e) => handleTranscriptChange(file.id, e.target.value)}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Process Button */}
        {audioFiles.length > 0 && (
          <div className="text-center mb-6">
            <button
              onClick={processAlignment}
              disabled={processing}
              className={`px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition flex items-center gap-3 mx-auto ${
                processing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Play className="w-6 h-6" />
              {processing ? 'Processing...' : 'Run Alignment'}
            </button>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Alignment Results
                </h2>
              </div>

              {results.map((result, idx) => (
                <div key={idx} className="mb-8 last:mb-0">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      {result.fileName}
                    </h3>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-white p-3 rounded shadow-sm">
                        <p className="text-xs text-gray-600">Total Duration</p>
                        <p className="text-lg font-bold text-indigo-600">
                          {result.totalDuration}s
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <p className="text-xs text-gray-600">Words</p>
                        <p className="text-lg font-bold text-indigo-600">
                          {result.wordCount}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <p className="text-xs text-gray-600">Phonemes</p>
                        <p className="text-lg font-bold text-indigo-600">
                          {result.phoneCount}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <p className="text-xs text-gray-600">Avg Word Duration</p>
                        <p className="text-lg font-bold text-indigo-600">
                          {result.avgWordDuration}s
                        </p>
                      </div>
                    </div>

                    {/* Word Alignments Table */}
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-gray-700 mb-3">Word Alignments</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Word</th>
                              <th className="p-2 text-left">Start Time</th>
                              <th className="p-2 text-left">End Time</th>
                              <th className="p-2 text-left">Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.wordAlignments.map((word, i) => (
                              <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-semibold">{word.word}</td>
                                <td className="p-2">{word.start}s</td>
                                <td className="p-2">{word.end}s</td>
                                <td className="p-2">{word.duration}s</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Phoneme Alignments Table */}
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-gray-700 mb-3">Phoneme Alignments (First 10)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Phoneme</th>
                              <th className="p-2 text-left">Start Time</th>
                              <th className="p-2 text-left">End Time</th>
                              <th className="p-2 text-left">Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.phoneAlignments.slice(0, 10).map((phone, i) => (
                              <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-mono font-semibold">{phone.phone}</td>
                                <td className="p-2">{phone.start}s</td>
                                <td className="p-2">{phone.end}s</td>
                                <td className="p-2">{phone.duration}s</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {result.phoneAlignments.length > 10 && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            ... and {result.phoneAlignments.length - 10} more phonemes
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Download Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => downloadTextGrid(result)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                      >
                        <Download className="w-5 h-5" />
                        Download TextGrid
                      </button>
                      <button
                        onClick={() => downloadReport(result)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                      >
                        <FileText className="w-5 h-5" />
                        Download Report
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="font-bold text-gray-800 mb-3">About Forced Alignment</h3>
          <p className="text-gray-600 text-sm mb-2">
            Forced alignment automatically matches audio recordings with text transcripts at the word and phoneme level.
            This tool provides timing information for each word and sound in your speech.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded mt-4">
            <p className="text-yellow-800 text-xs">
              <strong>Note:</strong> This is a demonstration tool. For actual MFA implementation,
              use the Montreal Forced Aligner with acoustic models and pronunciation dictionaries.
              Download the complete implementation package using the original generator above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MFAAlignmentTool;