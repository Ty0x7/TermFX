using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;

class TermFXLauncher
{
    static bool IsPortOpen(int port)
    {
        try
        {
            using (var client = new TcpClient())
            {
                var result = client.BeginConnect("127.0.0.1", port, null, null);
                var success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(250));
                if (!success) return false;
                client.EndConnect(result);
                return true;
            }
        }
        catch
        {
            return false;
        }
    }

    static string FindNodeExe()
    {
        string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string wingetNode = Path.Combine(localAppData, @"Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.16.0-win-x64\node.exe");
        if (File.Exists(wingetNode)) return wingetNode;

        string progFilesNode = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"nodejs\node.exe");
        if (File.Exists(progFilesNode)) return progFilesNode;

        string wingetDir = Path.Combine(localAppData, @"Microsoft\WinGet\Packages");
        if (Directory.Exists(wingetDir))
        {
            var found = Directory.GetFiles(wingetDir, "node.exe", SearchOption.AllDirectories);
            if (found.Length > 0) return found[0];
        }

        return "node.exe";
    }

    static string FindAppHostBrowser()
    {
        string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string progFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string progFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);

        string[] candidates = new string[]
        {
            Path.Combine(progFiles, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
            Path.Combine(progFilesX86, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
            Path.Combine(localAppData, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
            Path.Combine(progFiles, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(progFilesX86, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(localAppData, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(progFilesX86, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(progFiles, @"Microsoft\Edge\Application\msedge.exe")
        };

        foreach (var path in candidates)
        {
            if (File.Exists(path)) return path;
        }
        return null;
    }

    static string ResolveProjectDir()
    {
        string localDir = AppDomain.CurrentDomain.BaseDirectory;
        if (File.Exists(Path.Combine(localDir, "server.js")))
        {
            return localDir;
        }
        string docs = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
        string[] fallbackDirs = new string[]
        {
            Environment.GetEnvironmentVariable("TERMFX_HOME") ?? "",
            Path.Combine(docs, @"ChatGPT\TermFX"),
            @"C:\Users\ty0x7\Documents\ChatGPT\TermFX"
        };
        foreach (var dir in fallbackDirs)
        {
            if (dir.Length > 0 && File.Exists(Path.Combine(dir, "server.js")))
            {
                return dir;
            }
        }
        return localDir;
    }

    [STAThread]
    static void Main(string[] args)
    {
        string baseDir = ResolveProjectDir();
        string serverScript = Path.Combine(baseDir, "server.js");

        if (!IsPortOpen(4577))
        {
            string nodeExe = FindNodeExe();
            var psi = new ProcessStartInfo
            {
                FileName = nodeExe,
                Arguments = "\"" + serverScript + "\"",
                WorkingDirectory = baseDir,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden,
                UseShellExecute = false
            };
            Process.Start(psi);

            for (int i = 0; i < 30; i++)
            {
                if (IsPortOpen(4577)) break;
                Thread.Sleep(150);
            }
        }

        string browserExe = FindAppHostBrowser();
        if (browserExe != null)
        {
            string profileDir = Path.Combine(baseDir, "termfx_data", "window_profile");
            Directory.CreateDirectory(profileDir);

            var appPsi = new ProcessStartInfo
            {
                FileName = browserExe,
                Arguments = "--app=http://127.0.0.1:4577 --window-size=1440,840 --user-data-dir=\"" + profileDir + "\"",
                UseShellExecute = true
            };
            Process.Start(appPsi);
        }
        else
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "http://127.0.0.1:4577",
                UseShellExecute = true
            });
        }
    }
}
