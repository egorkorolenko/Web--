package URL;

import java.io.*;
import java.net.URL;
import java.net.URLConnection;
import java.util.List;
import java.util.Map;
import java.util.Scanner;

public class URLType {

    public void connect(String urlStr, String nameFile) {
        try {
            URL url = new URL(urlStr);
            URLConnection urlConnection = url.openConnection();

            Map<String, List<String>> map = urlConnection.getHeaderFields();
            for (String key : map.keySet()) {
                System.out.println(key + ":");
                List<String> values = map.get(key);
                for (String value : values) {
                    System.out.println("\t" + value);
                }
            }

            File file = new File(nameFile);

            try (InputStream inputStream = urlConnection.getInputStream();
                 BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
                 BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(file)))) {

                String line;
                while ((line = reader.readLine()) != null) {
                    writer.write(line);
                    writer.newLine();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String urlStr = scanner.next();
        String nameFile = scanner.next();
        URLType urlType = new URLType();
        urlType.connect(urlStr, nameFile);
    }
}
