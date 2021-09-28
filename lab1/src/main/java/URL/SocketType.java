package URL;

import java.io.*;
import java.net.MalformedURLException;
import java.net.Socket;
import java.net.URL;
import java.util.Scanner;

public class SocketType {

    public void connect(String strUrl, String nameFile) {
        try {
            URL url = new URL(strUrl);
            String path = url.getPath();
            if (path.isEmpty()) {
                path = "/";
            }
            File file = new File(nameFile);
            try (Socket socket = new Socket(url.getHost(), 80);
                 BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                 BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream()));
                 OutputStream fileOutputStream = new FileOutputStream(file);
                 BufferedWriter fileWriter = new BufferedWriter(new OutputStreamWriter(fileOutputStream));) {

                writer.write("GET " + path + " HTTP/1.1");
                writer.newLine();
                writer.write("Host: " + url.getHost());
                writer.newLine();
                writer.write("Connection: Close");
                writer.newLine();
                writer.newLine();
                writer.flush();

                String line = reader.readLine();
                while (line != null && !line.isEmpty()) {
                    System.out.println(line);
                    line = reader.readLine();
                }

                while ((line = reader.readLine()) != null) {
                    fileWriter.write(line);
                    fileWriter.newLine();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String url = scanner.next();
        String nameFile = scanner.next();
        SocketType socketType = new SocketType();
        socketType.connect(url, nameFile);
    }
}