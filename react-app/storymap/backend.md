1.Sisteme Giriş
Giriş yap butonu olmalı basıldığında şu urle gidilmeli
https://mebi.eba.gov.tr/login/cbs/1?redirectUrl=https://{baseUrl}/LoginRedirect
(cbs/1) Öğretmen girişi
(cbs/0) Öğrenci girişi
________________________________________
2.Giriş Yapma (Login)
 Endpoint
POST /api/Login
Ne Yapar?
Kullanıcının sisteme giriş yapmasını sağlar. Başarılı olursa sistem bu kullanıcıyı tanır.
Gönderilen Veri
{
  "token": "string"
}
Dönen Veri
{ Guid Kullaniciid, string Token }
🖥️ Ekranda Karşılığı
•	Önyüzde herhangi bir şey yok Sisteme giriş ile mebbis girişine yönlendirilen kullanıcı oradan bu sayfaya yönlendirilir. Bu sayfa user isimli query parametreyi alır ve gönderilen verideki token değerinin karşısına yazar ve post eder.
•	Dönen Veri deki Token değeri Bearer token olarak bundan sonra her http requestine eklenir.
________________________________________









3. Tüm Storymap’leri Listeleme
Endpoint
GET /api/Storymap
Ne Yapar?
Kullanıcının Sistemdeki tüm kendi Storymap kayıtlarını getirir.
Gönderilen Veri (Yok)
Dönen Veri
Liste şeklinde {Guid Id, string Sablon, string Baslik, string Aciklama, bool Isshared, string Publickey }
Ekranda Karşılığı
•	Storymap liste ekranı
•	Kart veya tablo görünümü
•	Her kayıtta: Şablon, Başlık, Açıklama, Düzenle / Sil butonları
________________________________________
4. Tek Bir Storymap Detayı
 Endpoint
GET /api/Storymap/{id}
Ne Yapar?
Seçilen Storymap’i göstermek için tek kayıt olarak sistemden çeker
Gönderilen Veri 
Parametre olarak url’e id verilir.
Dönen Veri
{Guid Id, string Sablon, string Baslik, string Aciklama, string Jsondata,
bool Isshared, string Publickey }

Ekranda Karşılığı
•	Storymap listeleme ekranında Güncelle butonuna basarsa bu metod çağırılır ve gelen veri ile Story map ekranı açılır. Burada artı yeni bir story map oluşturulmadığından alttaki buton güncelle olmalıdır.
________________________________________

5. Yeni Storymap Oluşturma
 Endpoint
POST /api/Storymap
 Ne Yapar?
Yeni bir Storymap oluşturur.
 Gönderilen Veri
{
  "sablon": "string",
  "baslik": "string",
  "aciklama": "string",
  "jsondata": "string"
}
Dönen Veri
Guid Id
 Ekranda Karşılığı
•	Story map ekranında kaydet butonuna bastığında çalıştırılır ve Geriye Story mapin Tekil Id alanını döner. Story map artık kaydedildiğinden bir  daha gönderilmez. Artık ilgili story mapteki buton Güncelle butonu olur ve bastığında bir sonraki maddedeki update metoduna burada alınan Id gönderilir. 
________________________________________


















 6. Storymap Güncelleme
Endpoint
PUT /api/Storymap/{id}
Ne Yapar?
Mevcut bir Storymap’i günceller.
Gönderilen Veri
Parametre olarak url’e id verilir ayrıca aşağıdaki data eklenir
{
  "sablon": "string",
  "baslik": "string",
  "aciklama": "string",
  "jsondata": "string"
}
Dönen Veri (Yok)
Ekranda Karşılığı
•	Bir story mapi kaydettikten sonra veya Listele ekranından güncelle dedikten sonra story map ekranındaki güncelle butonuna basıldığında çağırılır.
________________________________________
7. Storymap Silme
Endpoint
DELETE /api/Storymap/{id}
🎯 Ne Yapar?
Storymap’i tamamen siler.
Gönderilen Veri 
Parametre olarak url’e id verilir.
Dönen Veri (Yok)
🖥️ Ekranda Karşılığı
•	Liste ekranında Sil Butonu
•	Onay penceresi (emin misiniz?)
________________________________________
8. Dosya Yükleme
 Endpoint
POST /api/Dosya
Ne Yapar?
Kullanıcının bilgisayarından bir dosya yüklemesini sağlar.
 Gönderilen Veri
•	multipart/form-data (Alan adı : File)
Dönen Veri
String - dosya tam adı
Ekranda Karşılığı
•	Dosya seçme alanı
•	“Yükle” butonu
•	Gelen dosya adı cdn base urline eklenip resim ekranda gösterilebilir.
•	Gelen dosya adı ilgili resmin adı olarak json içerisine set edilmelidir.
________________________________________
9. Storymap Paylaşma
Endpoint
PATCH /api/Storymap/share/{id}
Ne Yapar?
Storymap’i başkalarının görebileceği şekilde paylaşılabilir hale getirir. Paylaşılabilir olduğunda ilgili story mapin Public key verisi paylaşılabilir.
Gönderilen Veri
Parametre olarak url’e id verilir
Dönen Veri (Yok)
Ekranda Karşılığı
•	“Paylaş / Paylaşımı Durdur” butonu (Switch / toggle) şeklinde.
•	Eğer storymap kaydedilmediyse bu buton görünmez
•	Kaydedilmiş ya da güncelleme halindeki storymapin paylaşılabilir olmasını sağlamak için bu metod kullanılır.
________________________________________
10. Storymap Paylaşımı Kapatma
📍 Endpoint
PATCH /api/Storymap/unshare/{id}
🎯 Ne Yapar?
Storymap’in paylaşımını kapatır.
Gönderilen Veri
Parametre olarak url’e id verilir
Dönen Veri (Yok)
🖥️ Ekranda Karşılığı
•	“Paylaş / Paylaşımı Durdur” butonu (Switch / toggle) şeklinde.
•	Eğer storymap kaydedilmediyse bu buton görünmez
•	Kaydedilmiş ya da güncelleme halindeki storymapin paylaşımını durdurmak için bu metod kullanılır.













Api Base Url : https://ogmmateryal.eba.gov.tr/cbs-backend/api
Cdn Base Klasoru : https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles
Swagger Teknik Dökümanı
{
  "openapi": "3.0.4",
  "info": {
    "title": "CleanApp.API",
    "version": "v1"
  },
  "paths": {
    "/api/Dosya": {
      "post": {
        "tags": [
          "Dosya"
        ],
        "requestBody": {
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "File": {
                    "type": "string",
                    "format": "binary"
                  }
                }
              },
              "encoding": {
                "File": {
                  "style": "form"
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/HealtCheck": {
      "get": {
        "tags": [
          "HealtCheck"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Login": {
      "post": {
        "tags": [
          "Login"
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Storymap": {
      "get": {
        "tags": [
          "Storymap"
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "post": {
        "tags": [
          "Storymap"
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/StorymapCreateRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/StorymapCreateRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/StorymapCreateRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Storymap/{id}": {
      "get": {
        "tags": [
          "Storymap"
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "put": {
        "tags": [
          "Storymap"
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/StorymapUpdateRequest"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/StorymapUpdateRequest"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/StorymapUpdateRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      },
      "delete": {
        "tags": [
          "Storymap"
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Storymap/share/{id}": {
      "patch": {
        "tags": [
          "Storymap"
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/api/Storymap/unshare/{id}": {
      "patch": {
        "tags": [
          "Storymap"
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "LoginRequest": {
        "type": "object",
        "properties": {
          "token": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "StorymapCreateRequest": {
        "type": "object",
        "properties": {
          "sablon": {
            "type": "string",
            "nullable": true
          },
          "baslik": {
            "type": "string",
            "nullable": true
          },
          "aciklama": {
            "type": "string",
            "nullable": true
          },
          "jsondata": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "StorymapUpdateRequest": {
        "type": "object",
        "properties": {
          "sablon": {
            "type": "string",
            "nullable": true
          },
          "baslik": {
            "type": "string",
            "nullable": true
          },
          "aciklama": {
            "type": "string",
            "nullable": true
          },
          "jsondata": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      }
    },
    "securitySchemes": {
      "Bearer": {
        "type": "apiKey",
        "description": "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'",
        "name": "Authorization",
        "in": "header"
      }
    }
  },
  "security": [
    {
      "Bearer": [ ]
    }
  ]
}


